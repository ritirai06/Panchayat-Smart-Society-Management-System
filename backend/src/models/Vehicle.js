const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  society: { type: mongoose.Schema.Types.ObjectId, ref: 'Society', required: true },
  resident: { type: mongoose.Schema.Types.ObjectId, ref: 'Resident', required: true },
  ownerName: { type: String, required: true },
  flatNumber: { type: String, required: true },
  vehicleNumber: { type: String, required: true, uppercase: true, trim: true },
  vehicleType: { type: String, enum: ['Car', 'Bike', 'EV', 'Other'], default: 'Car' },
  brand: { type: String },
  color: { type: String },
  parkingSlot: { type: mongoose.Schema.Types.ObjectId, ref: 'ParkingSlot', default: null },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

vehicleSchema.index({ society: 1, vehicleNumber: 1 }, { unique: true });

module.exports = mongoose.model('Vehicle', vehicleSchema);
