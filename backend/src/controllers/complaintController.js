const Complaint = require('../models/Complaint');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { uploadImage } = require('../utils/cloudinary');
const { sendPush, sendPushMulti } = require('../utils/firebase');

const createComplaint = async (req, res) => {
  try {
    const societyId = req.body.societyId || req.user.society;
    if (!societyId) {
      return res.status(400).json({ success: false, message: 'User is not assigned to a society' });
    }

    // Handle image uploads if files were attached
    let images = [];
    if (req.files?.length) {
      try {
        const uploads = await Promise.all(req.files.map(f => uploadImage(f.buffer)));
        images = uploads.map(u => u.url);
      } catch (uploadErr) {
        console.error('Cloudinary Upload Error:', uploadErr.message);
        // If Cloudinary is missing, we can either fail or proceed without images.
        // Failing with a 400 is better so the user knows why.
        return res.status(400).json({ 
          success: false, 
          message: 'Image upload failed. Please ensure Cloudinary is configured or try without images.' 
        });
      }
    }

    const complaint = await Complaint.create({
      ...req.body,
      raisedBy: req.user._id,
      society: societyId,
      images,
    });

    console.log(`Complaint created: ${complaint._id} by ${req.user.name}`);

    // Socket.IO real-time
    const io = req.app.get('io');
    io.to(complaint.society.toString()).emit('new_complaint', complaint);

    // In-app notification (broadcast to society)
    await Notification.create({
      title: 'New Complaint',
      message: `${req.user.name} raised: ${complaint.title}`,
      type: 'complaint',
      society: complaint.society,
    });

    // FCM push to admin(s)
    const admins = await User.find({ society: societyId, role: 'admin' }).select('fcmToken').lean();
    const tokens = admins.map(a => a.fcmToken).filter(Boolean);
    await sendPushMulti(tokens, 'New Complaint', `${req.user.name}: ${complaint.title}`, { complaintId: complaint._id.toString() });

    res.status(201).json({ success: true, complaint });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getComplaints = async (req, res) => {
  try {
    const filter = { society: req.params.societyId };
    if (req.query.status) filter.status = req.query.status;
    if (req.query.category) filter.category = req.query.category;
    if (req.query.priority) filter.priority = req.query.priority;
    if (req.query.search) filter.title = new RegExp(req.query.search, 'i');
    // Residents only see their own complaints
    if (req.user.role === 'resident') filter.raisedBy = req.user._id;

    const complaints = await Complaint.find(filter)
      .populate('raisedBy', 'name email')
      .populate('assignedTo', 'name')
      .populate('flat', 'flatNumber')
      .sort({ createdAt: -1 });

    res.json({ success: true, complaints, total: complaints.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateComplaint = async (req, res) => {
  try {
    const { status, assignedTo, comment } = req.body;
    const complaint = await Complaint.findById(req.params.id).populate('raisedBy', 'name fcmToken');
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });

    if (status) {
      complaint.status = status;
      if (status === 'Resolved') complaint.resolvedAt = new Date();
    }
    if (assignedTo) complaint.assignedTo = assignedTo;
    if (comment) complaint.comments.push({ user: req.user._id, text: comment });

    await complaint.save();

    // Socket.IO real-time
    const io = req.app.get('io');
    io.to(complaint.society.toString()).emit('complaint_updated', complaint);

    // FCM push to the resident who raised the complaint
    if (status && complaint.raisedBy?.fcmToken) {
      await sendPush(
        complaint.raisedBy.fcmToken,
        'Complaint Update',
        `Your complaint "${complaint.title}" is now ${status}`,
        { complaintId: complaint._id.toString() }
      );
    }

    res.json({ success: true, complaint });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteComplaint = async (req, res) => {
  try {
    await Complaint.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Complaint deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getComplaintStats = async (req, res) => {
  try {
    const societyId = req.params.societyId;
    const [byCategory, byStatus] = await Promise.all([
      Complaint.aggregate([
        { $match: { society: require('mongoose').Types.ObjectId.createFromHexString(societyId) } },
        { $group: { _id: '$category', count: { $sum: 1 } } }
      ]),
      Complaint.aggregate([
        { $match: { society: require('mongoose').Types.ObjectId.createFromHexString(societyId) } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ])
    ]);
    res.json({ success: true, byCategory, byStatus });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { createComplaint, getComplaints, updateComplaint, deleteComplaint, getComplaintStats };
