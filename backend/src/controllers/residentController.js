const Flat = require('../models/Flat');
const Resident = require('../models/Resident');
const Society = require('../models/Society');
const { uploadImage } = require('../utils/cloudinary');

// --- FLAT CONTROLLERS ---
const createFlat = async (req, res) => {
  try {
    let image = req.body.image;
    if (req.files?.length) {
      const upload = await uploadImage(req.files[0].buffer);
      image = upload.url;
    }
    const flat = await Flat.create({ ...req.body, image, society: req.body.societyId || req.user.society });
    await Society.findByIdAndUpdate(flat.society, { $inc: { totalFlats: 1 } });
    res.status(201).json({ success: true, flat });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getFlats = async (req, res) => {
  try {
    const flats = await Flat.find({ society: req.params.societyId }).populate('owner');
    res.json({ success: true, flats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateFlat = async (req, res) => {
  try {
    let image = req.body.image;
    if (req.files?.length) {
      const upload = await uploadImage(req.files[0].buffer);
      image = upload.url;
    }
    const flat = await Flat.findByIdAndUpdate(req.params.id, { ...req.body, image }, { new: true });
    res.json({ success: true, flat });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteFlat = async (req, res) => {
  try {
    await Flat.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Flat deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// --- RESIDENT CONTROLLERS ---
const addResident = async (req, res) => {
  try {
    let image = req.body.image;
    if (req.files?.length) {
      const upload = await uploadImage(req.files[0].buffer);
      image = upload.url;
    }
    const data = { ...req.body };
    if (typeof data.familyMembers === 'string') {
      try { data.familyMembers = JSON.parse(data.familyMembers); } catch (e) { data.familyMembers = []; }
    }
    const resident = await Resident.create({ ...data, image, society: req.body.societyId || req.user.society });
    await Flat.findByIdAndUpdate(req.body.flat, { isOccupied: true, owner: resident._id });
    res.status(201).json({ success: true, resident });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getResidents = async (req, res) => {
  try {
    const filter = { society: req.params.societyId, isActive: true };
    // Search by name or phone
    if (req.query.search) {
      const regex = new RegExp(req.query.search, 'i');
      filter.$or = [{ name: regex }, { phone: regex }, { email: regex }];
    }
    if (req.query.type) filter.type = req.query.type; // owner | tenant

    const residents = await Resident.find(filter)
      .populate('flat', 'flatNumber floor type');
    res.json({ success: true, residents });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateResident = async (req, res) => {
  try {
    let image = req.body.image;
    if (req.files?.length) {
      const upload = await uploadImage(req.files[0].buffer);
      image = upload.url;
    }
    const data = { ...req.body };
    if (typeof data.familyMembers === 'string') {
      try { data.familyMembers = JSON.parse(data.familyMembers); } catch (e) { data.familyMembers = []; }
    }
    const resident = await Resident.findByIdAndUpdate(req.params.id, { ...data, image }, { new: true });
    res.json({ success: true, resident });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteResident = async (req, res) => {
  try {
    const resident = await Resident.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    await Flat.findByIdAndUpdate(resident.flat, { isOccupied: false });
    res.json({ success: true, message: 'Resident removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { createFlat, getFlats, updateFlat, deleteFlat, addResident, getResidents, updateResident, deleteResident };
