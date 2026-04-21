const Society = require('../models/Society');
const { uploadImage } = require('../utils/cloudinary');
const User = require('../models/User');
const { embedBylaws } = require('../utils/langchain');

const createSociety = async (req, res) => {
  try {
    const society = await Society.create({ ...req.body, admin: req.user._id });
    await User.findByIdAndUpdate(req.user._id, { society: society._id, role: 'admin' });
    res.status(201).json({ success: true, society });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getSociety = async (req, res) => {
  try {
    const society = await Society.findById(req.params.id).populate('admin', 'name email');
    if (!society) return res.status(404).json({ success: false, message: 'Society not found' });
    res.json({ success: true, society });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateSociety = async (req, res) => {
  try {
    let logo = req.body.logo;
    if (req.files?.length) {
      const upload = await uploadImage(req.files[0].buffer);
      logo = upload.url;
    }
    const data = { ...req.body };
    if (typeof data.amenities === 'string') {
      try { data.amenities = JSON.parse(data.amenities); } catch (e) { data.amenities = []; }
    }
    const society = await Society.findByIdAndUpdate(req.params.id, { ...data, logo }, { new: true });
    res.json({ success: true, society });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const uploadRules = async (req, res) => {
  try {
    const { rules } = req.body;

    // Generate LangChain embeddings for semantic bylaw search
    let bylawChunks = [];
    try {
      bylawChunks = await embedBylaws(rules);
    } catch (e) {
      console.warn('Bylaw embedding skipped (no OpenAI key):', e.message);
    }

    const society = await Society.findByIdAndUpdate(
      req.params.id,
      { rules, bylawChunks },
      { new: true }
    );
    res.json({ success: true, message: 'Rules updated', society });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getPublicStats = async (req, res) => {
  try {
    const [societies, residents, complaints] = await Promise.all([
      Society.countDocuments(),
      require('../models/Resident').countDocuments({ isActive: true }),
      require('../models/Complaint').countDocuments({ status: 'Resolved' })
    ]);
    res.json({
      success: true,
      stats: [
        { label: 'Verified Societies', value: `${societies}+` },
        { label: 'Happy Residents', value: `${(residents / 1000).toFixed(1)}k+` },
        { label: 'Issues Resolved', value: `${complaints}+` }
      ]
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { createSociety, getSociety, updateSociety, uploadRules, getPublicStats };
