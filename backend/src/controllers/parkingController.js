const ParkingSlot = require('../models/ParkingSlot');
const Vehicle = require('../models/Vehicle');
const Resident = require('../models/Resident');
const Notification = require('../models/Notification');

// ── Slots ─────────────────────────────────────────────────────────────────────

const getSlots = async (req, res) => {
  try {
    const { societyId } = req.params;
    const filter = { society: societyId };
    if (req.query.type) filter.slotType = req.query.type;
    if (req.query.status) filter.status = req.query.status;
    const slots = await ParkingSlot.find(filter)
      .populate('assignedResident', 'name flatNumber')
      .populate('assignedVehicle', 'vehicleNumber vehicleType brand color')
      .sort({ slotNumber: 1 });
    res.json({ success: true, slots });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createSlot = async (req, res) => {
  try {
    const societyId = req.user.society?._id || req.user.society;
    const slot = await ParkingSlot.create({ ...req.body, society: societyId });
    res.status(201).json({ success: true, slot });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ success: false, message: 'Slot number already exists' });
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateSlot = async (req, res) => {
  try {
    const slot = await ParkingSlot.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, slot });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteSlot = async (req, res) => {
  try {
    await ParkingSlot.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Slot deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Assign / Release ──────────────────────────────────────────────────────────

const assignSlot = async (req, res) => {
  try {
    const { slotId, vehicleId, residentId } = req.body;
    const slot = await ParkingSlot.findById(slotId);
    if (!slot) return res.status(404).json({ success: false, message: 'Slot not found' });
    if (slot.status === 'Occupied') return res.status(400).json({ success: false, message: 'Slot already occupied' });

    // Release previous slot of vehicle if any
    const vehicle = await Vehicle.findById(vehicleId);
    if (vehicle?.parkingSlot) {
      await ParkingSlot.findByIdAndUpdate(vehicle.parkingSlot, {
        status: 'Available', assignedResident: null, assignedVehicle: null
      });
    }

    await ParkingSlot.findByIdAndUpdate(slotId, {
      status: 'Occupied', assignedResident: residentId, assignedVehicle: vehicleId
    });
    await Vehicle.findByIdAndUpdate(vehicleId, { parkingSlot: slotId });

    const societyId = req.user.society?._id || req.user.society;
    const resident = await Resident.findById(residentId).populate('user');
    if (resident?.user) {
      await Notification.create({
        title: 'Parking Slot Assigned',
        message: `Slot ${slot.slotNumber} (${slot.block}, ${slot.floor}) has been assigned to your vehicle.`,
        type: 'system',
        recipient: resident.user._id,
        society: societyId,
      });
      const io = req.app.get('io');
      io?.to(String(societyId)).emit('parking_assigned', { slotNumber: slot.slotNumber, residentId });
    }

    res.json({ success: true, message: `Slot ${slot.slotNumber} assigned successfully` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const releaseSlot = async (req, res) => {
  try {
    const slot = await ParkingSlot.findById(req.params.id);
    if (!slot) return res.status(404).json({ success: false, message: 'Slot not found' });
    if (slot.assignedVehicle) {
      await Vehicle.findByIdAndUpdate(slot.assignedVehicle, { parkingSlot: null });
    }
    await ParkingSlot.findByIdAndUpdate(req.params.id, {
      status: slot.isVisitorSlot ? 'Visitor' : 'Available',
      assignedResident: null, assignedVehicle: null
    });
    res.json({ success: true, message: 'Slot released' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const autoAssign = async (req, res) => {
  try {
    const { vehicleId, residentId, slotType } = req.body;
    const societyId = req.user.society?._id || req.user.society;
    const slot = await ParkingSlot.findOne({
      society: societyId,
      status: 'Available',
      isVisitorSlot: false,
      slotType: slotType || 'Car',
    }).sort({ slotNumber: 1 });

    if (!slot) return res.status(404).json({ success: false, message: `No available ${slotType || 'Car'} slots` });

    const vehicle = await Vehicle.findById(vehicleId);
    if (vehicle?.parkingSlot) {
      await ParkingSlot.findByIdAndUpdate(vehicle.parkingSlot, {
        status: 'Available', assignedResident: null, assignedVehicle: null
      });
    }

    await ParkingSlot.findByIdAndUpdate(slot._id, {
      status: 'Occupied', assignedResident: residentId, assignedVehicle: vehicleId
    });
    await Vehicle.findByIdAndUpdate(vehicleId, { parkingSlot: slot._id });

    res.json({ success: true, message: `Auto-assigned to slot ${slot.slotNumber}`, slot });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Vehicles ──────────────────────────────────────────────────────────────────

const getVehicles = async (req, res) => {
  try {
    const { societyId } = req.params;
    const filter = { society: societyId, isActive: true };
    if (req.query.search) {
      const r = new RegExp(req.query.search, 'i');
      filter.$or = [{ vehicleNumber: r }, { ownerName: r }, { flatNumber: r }];
    }
    const vehicles = await Vehicle.find(filter)
      .populate('resident', 'name flatNumber')
      .populate('parkingSlot', 'slotNumber block floor slotType')
      .sort({ createdAt: -1 });
    res.json({ success: true, vehicles });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const addVehicle = async (req, res) => {
  try {
    const societyId = req.user.society?._id || req.user.society;
    const vehicle = await Vehicle.create({ ...req.body, society: societyId });
    res.status(201).json({ success: true, vehicle });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ success: false, message: 'Vehicle number already registered' });
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, vehicle });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (vehicle?.parkingSlot) {
      await ParkingSlot.findByIdAndUpdate(vehicle.parkingSlot, {
        status: 'Available', assignedResident: null, assignedVehicle: null
      });
    }
    await Vehicle.findByIdAndUpdate(req.params.id, { isActive: false, parkingSlot: null });
    res.json({ success: true, message: 'Vehicle removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Stats ─────────────────────────────────────────────────────────────────────

const getParkingStats = async (req, res) => {
  try {
    const { societyId } = req.params;
    const [slots, vehicles] = await Promise.all([
      ParkingSlot.find({ society: societyId }),
      Vehicle.countDocuments({ society: societyId, isActive: true }),
    ]);
    const total = slots.length;
    const occupied = slots.filter(s => s.status === 'Occupied').length;
    const available = slots.filter(s => s.status === 'Available').length;
    const visitor = slots.filter(s => s.isVisitorSlot).length;
    const ev = slots.filter(s => s.slotType === 'EV').length;
    const evOccupied = slots.filter(s => s.slotType === 'EV' && s.status === 'Occupied').length;
    const byBlock = slots.reduce((acc, s) => {
      acc[s.block] = acc[s.block] || { total: 0, occupied: 0 };
      acc[s.block].total++;
      if (s.status === 'Occupied') acc[s.block].occupied++;
      return acc;
    }, {});
    res.json({ success: true, stats: { total, occupied, available, visitor, ev, evOccupied, vehicles, byBlock } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getSlots, createSlot, updateSlot, deleteSlot, assignSlot, releaseSlot, autoAssign, getVehicles, addVehicle, updateVehicle, deleteVehicle, getParkingStats };
