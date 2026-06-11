const router = require('express').Router();
const { createSociety, getSociety, updateSociety, uploadRules, getPublicStats } = require('../controllers/societyController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/public/stats', getPublicStats);

router.post('/', protect, createSociety);
router.get('/:id', protect, getSociety);
router.get('/:id/dashboard', protect, async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const sid = mongoose.Types.ObjectId.createFromHexString(req.params.id);
    const Flat = require('../models/Flat');
    const Resident = require('../models/Resident');
    const Complaint = require('../models/Complaint');
    const Payment = require('../models/Payment');

    const [society, flatStats, residentCount, complaintStats, paymentStats, recentComplaints, recentPayments, flatsList, residentsList] = await Promise.all([
      require('../models/Society').findById(sid).lean(),
      Flat.aggregate([
        { $match: { society: sid } },
        { $group: { _id: null, total: { $sum: 1 }, occupied: { $sum: { $cond: ['$isOccupied', 1, 0] } } } }
      ]),
      Resident.countDocuments({ society: sid, isActive: true }),
      Complaint.aggregate([
        { $match: { society: sid } },
        { $facet: {
          byCategory: [{ $group: { _id: '$category', count: { $sum: 1 } } }],
          byStatus:   [{ $group: { _id: '$status',   count: { $sum: 1 } } }]
        }}
      ]),
      Payment.aggregate([
        { $match: { society: sid } },
        { $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$amount' } } }
      ]),
      Complaint.find({ society: sid }).sort({ createdAt: -1 }).limit(20)
        .populate('flat', 'flatNumber').lean(),
      Payment.find({ society: sid }).sort({ createdAt: -1 }).limit(100)
        .populate('flat', 'flatNumber').populate('resident', 'name').lean(),
      Flat.find({ society: sid }).populate('owner', 'name').lean(),
      Resident.find({ society: sid, isActive: true }).populate('flat', 'flatNumber floor type').lean(),
    ]);

    const fs = flatStats[0] || { total: 0, occupied: 0 };
    const cs = complaintStats[0] || { byCategory: [], byStatus: [] };

    res.json({
      success: true,
      society,
      flats: fs.total,
      occupiedFlats: fs.occupied,
      residents: residentCount,
      complaints: { byCategory: cs.byCategory, byStatus: cs.byStatus },
      payments: paymentStats,
      recentComplaints,
      recentPayments,
      flatsList,
      residentsList,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
router.put('/:id', protect, authorize('admin'), upload.array('image', 1), updateSociety);
router.put('/:id/rules', protect, authorize('admin'), uploadRules);

module.exports = router;
