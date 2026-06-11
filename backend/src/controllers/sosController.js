const SOS = require('../models/SOS');
const Notification = require('../models/Notification');
const Resident = require('../models/Resident');

const triggerSOS = async (req, res) => {
  try {
    const societyId = req.user.society?._id || req.user.society;
    const { type, description } = req.body;

    // Find resident record for flat number
    const resident = await Resident.findOne({ user: req.user._id, society: societyId });

    const sos = await SOS.create({
      society: societyId,
      raisedBy: req.user._id,
      resident: resident?._id,
      flatNumber: resident?.flat ? undefined : req.body.flatNumber,
      type,
      description,
    });

    // Populate for socket broadcast
    const populated = await SOS.findById(sos._id)
      .populate('raisedBy', 'name')
      .populate('resident', 'name flatNumber');

    // Broadcast to entire society (admins + security)
    const io = req.app.get('io');
    io?.to(String(societyId)).emit('sos_alert', {
      type,
      raisedBy: req.user.name,
      flatNumber: populated.resident?.flatNumber || req.body.flatNumber || 'Unknown',
      description,
      sosId: sos._id,
      timestamp: sos.createdAt,
    });

    // Create urgent notification
    await Notification.create({
      title: `SOS Alert — ${type}`,
      message: `Emergency reported by ${req.user.name}${populated.resident?.flatNumber ? ` (Flat ${populated.resident.flatNumber})` : ''}. Type: ${type}. ${description || ''}`,
      type: 'system',
      society: societyId,
    });

    res.status(201).json({ success: true, sos: populated });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const getSosLogs = async (req, res) => {
  try {
    const { societyId } = req.params;
    const filter = { society: societyId };
    if (req.query.status) filter.status = req.query.status;
    const logs = await SOS.find(filter)
      .populate('raisedBy', 'name email')
      .populate('resident', 'name flatNumber')
      .populate('acknowledgedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ success: true, logs });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const acknowledgesSOS = async (req, res) => {
  try {
    const sos = await SOS.findByIdAndUpdate(
      req.params.id,
      { status: 'Acknowledged', acknowledgedBy: req.user._id },
      { new: true }
    );
    if (!sos) return res.status(404).json({ success: false, message: 'SOS not found' });
    const io = req.app.get('io');
    io?.to(String(sos.society)).emit('sos_acknowledged', { sosId: sos._id, by: req.user.name });
    res.json({ success: true, sos });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const resolveSOS = async (req, res) => {
  try {
    const sos = await SOS.findByIdAndUpdate(
      req.params.id,
      { status: 'Resolved', resolvedAt: new Date() },
      { new: true }
    );
    if (!sos) return res.status(404).json({ success: false, message: 'SOS not found' });
    const io = req.app.get('io');
    io?.to(String(sos.society)).emit('sos_resolved', { sosId: sos._id });
    res.json({ success: true, sos });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

module.exports = { triggerSOS, getSosLogs, acknowledgesSOS, resolveSOS };
