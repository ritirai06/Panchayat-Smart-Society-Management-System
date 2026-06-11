const mongoose = require('mongoose');

const parkingSlotSchema = new mongoose.Schema({
  society: { type: mongoose.Schema.Types.ObjectId, ref: 'Society', required: true },
  slotNumber: { type: String, required: true },
  block: { type: String, default: 'A' },
  floor: { type: String, default: 'B1' },
  slotType: { type: String, enum: ['Car', 'Bike', 'EV'], default: 'Car' },
  status: { type: String, enum: ['Available', 'Occupied', 'Reserved', 'Visitor'], default: 'Available' },
  assignedResident: { type: mongoose.Schema.Types.ObjectId, ref: 'Resident', default: null },
  assignedVehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', default: null },
  isVisitorSlot: { type: Boolean, default: false },
}, { timestamps: true });

parkingSlotSchema.index({ society: 1, slotNumber: 1 }, { unique: true });

module.exports = mongoose.model('ParkingSlot', parkingSlotSchema);
