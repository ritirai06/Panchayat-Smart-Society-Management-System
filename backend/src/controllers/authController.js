const User = require('../models/User');
const Society = require('../models/Society');
const { generateToken } = require('../utils/jwt');

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password, phone, role, societyId } = req.body;
    if (await User.findOne({ email }))
      return res.status(400).json({ success: false, message: 'Email already registered' });

    const user = await User.create({ name, email, password, phone, role: role || 'resident', society: societyId });
    const token = generateToken(user._id, user.role);
    res.status(201).json({ success: true, token, user: { id: user._id, name, email, role: user.role } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`Login attempt for: ${email}`);
    
    const user = await User.findOne({ email }).populate('society', 'name');
    if (!user) {
      console.log(`User not found: ${email}`);
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await user.matchPassword(password);
    console.log(`Password match for ${email}: ${isMatch}`);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken(user._id, user.role);
    res.json({
      success: true, token,
      user: { id: user._id, name: user.name, email, role: user.role, society: user.society, avatar: user.avatar }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  const user = await User.findById(req.user._id).select('-password').populate('society', 'name city');
  res.json({ success: true, user });
};

// PUT /api/auth/fcm-token
const updateFcmToken = async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { fcmToken: req.body.token });
  res.json({ success: true });
};

module.exports = { register, login, getMe, updateFcmToken };
