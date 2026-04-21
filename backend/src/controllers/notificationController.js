const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendPushMulti } = require('../utils/firebase');

const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      $or: [{ recipient: req.user._id }, { recipient: null, society: req.user.society }]
    }).sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, notifications });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const markRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true, readAt: new Date() });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const markAllRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { $or: [{ recipient: req.user._id }, { society: req.user.society, recipient: null }], isRead: false },
      { isRead: true, readAt: new Date() }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createAnnouncement = async (req, res) => {
  try {
    const { title, message } = req.body;
    const societyId = req.user.society?._id?.toString() || req.user.society?.toString();
    const notification = await Notification.create({
      title, message, type: 'announcement',
      society: societyId, recipient: null,
    });

    // Socket.IO broadcast
    const io = req.app.get('io');
    io.to(societyId).emit('announcement', notification);

    // FCM push to all society members
    const members = await User.find({ society: societyId }).select('fcmToken').lean();
    const tokens = members.map(m => m.fcmToken).filter(Boolean);
    await sendPushMulti(tokens, title, message, { type: 'announcement' });

    res.status(201).json({ success: true, notification });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getNotifications, markRead, markAllRead, createAnnouncement };
