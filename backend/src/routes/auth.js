const router = require('express').Router();
const { register, login, getMe, updateFcmToken } = require('../controllers/authController');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/fcm-token', protect, updateFcmToken);

// Get staff list for complaint assignment
router.get('/staff/:societyId', protect, authorize('admin'), async (req, res) => {
  try {
    const staff = await User.find({ society: req.params.societyId, role: 'staff' }).select('name email');
    res.json({ success: true, staff });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get all society members (for admin)
router.get('/members/:societyId', protect, authorize('admin'), async (req, res) => {
  try {
    const members = await User.find({ society: req.params.societyId }).select('name email role');
    res.json({ success: true, members });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
