const Visitor = require('../models/Visitor');
const Notification = require('../models/Notification');

const createVisitor = async (req, res) => {
  try {
    const societyId = req.user.society?._id || req.user.society;
    const { validHours = 24, ...rest } = req.body;
    const validUntil = new Date(Date.now() + Number(validHours) * 60 * 60 * 1000);
    const visitor = await Visitor.create({ ...rest, society: societyId, hostedBy: req.user._id, validUntil });
    const io = req.app.get('io');
    io?.to(String(societyId)).emit('visitor_created', { visitorName: visitor.visitorName, flatNumber: visitor.flatNumber });
    res.status(201).json({ success: true, visitor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getVisitors = async (req, res) => {
  try {
    const { societyId } = req.params;
    const filter = { society: societyId };
    if (req.query.status) filter.status = req.query.status;
    if (req.query.type) filter.visitorType = req.query.type;
    if (req.query.search) {
      const r = new RegExp(req.query.search, 'i');
      filter.$or = [{ visitorName: r }, { visitorPhone: r }, { flatNumber: r }, { vehicleNumber: r }];
    }
    const visitors = await Visitor.find(filter)
      .populate('resident', 'name')
      .populate('hostedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(200);
    res.json({ success: true, visitors });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getMyVisitors = async (req, res) => {
  try {
    const visitors = await Visitor.find({ hostedBy: req.user._id }).sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, visitors });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const verifyGatePass = async (req, res) => {
  try {
    const visitor = await Visitor.findOne({ qrToken: req.params.token })
      .populate('resident', 'name flatNumber')
      .populate('hostedBy', 'name email');
    if (!visitor) return res.status(404).json({ success: false, message: 'Invalid gate pass' });
    if (new Date() > visitor.validUntil) {
      await Visitor.findByIdAndUpdate(visitor._id, { status: 'Expired' });
      return res.status(400).json({ success: false, message: 'Gate pass expired' });
    }
    if (visitor.status === 'Denied') return res.status(403).json({ success: false, message: 'Gate pass denied' });
    res.json({ success: true, visitor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const markEntry = async (req, res) => {
  try {
    const visitor = await Visitor.findOne({ qrToken: req.params.token });
    if (!visitor) return res.status(404).json({ success: false, message: 'Invalid gate pass' });
    if (new Date() > visitor.validUntil) return res.status(400).json({ success: false, message: 'Pass expired' });
    if (visitor.status === 'Inside') return res.status(400).json({ success: false, message: 'Already inside' });
    const updated = await Visitor.findByIdAndUpdate(visitor._id,
      { status: 'Inside', entryTime: new Date(), gate: req.body.gate || 'Main Gate' }, { new: true });
    const societyId = visitor.society;
    await Notification.create({
      title: 'Visitor Entry',
      message: `${visitor.visitorName} (${visitor.visitorType}) has entered from ${updated.gate}.`,
      type: 'system', recipient: visitor.hostedBy, society: societyId,
    });
    req.app.get('io')?.to(String(societyId)).emit('visitor_entry', { visitorName: visitor.visitorName, flatNumber: visitor.flatNumber });
    res.json({ success: true, visitor: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const markExit = async (req, res) => {
  try {
    const visitor = await Visitor.findByIdAndUpdate(req.params.id,
      { status: 'Exited', exitTime: new Date() }, { new: true });
    if (!visitor) return res.status(404).json({ success: false, message: 'Visitor not found' });
    req.app.get('io')?.to(String(visitor.society)).emit('visitor_exit', { visitorName: visitor.visitorName });
    res.json({ success: true, visitor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateVisitor = async (req, res) => {
  try {
    const visitor = await Visitor.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, visitor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteVisitor = async (req, res) => {
  try {
    await Visitor.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Visitor deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getVisitorStats = async (req, res) => {
  try {
    const { societyId } = req.params;
    const mongoose = require('mongoose');
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const [total, todayCount, inside, byType] = await Promise.all([
      Visitor.countDocuments({ society: societyId }),
      Visitor.countDocuments({ society: societyId, createdAt: { $gte: today } }),
      Visitor.countDocuments({ society: societyId, status: 'Inside' }),
      Visitor.aggregate([
        { $match: { society: new mongoose.Types.ObjectId(societyId) } },
        { $group: { _id: '$visitorType', count: { $sum: 1 } } },
      ]),
    ]);
    res.json({ success: true, stats: { total, todayCount, inside, byType } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { createVisitor, getVisitors, getMyVisitors, verifyGatePass, markEntry, markExit, updateVisitor, deleteVisitor, getVisitorStats };
