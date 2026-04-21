const mongoose = require('mongoose');

const flatSchema = new mongoose.Schema({
  flatNumber: { type: String, required: true },
  floor: { type: Number },
  society: { type: mongoose.Schema.Types.ObjectId, ref: 'Society', required: true },
  type: { type: String, enum: ['1BHK', '2BHK', '3BHK', '4BHK', 'Studio'], default: '2BHK' },
  area: { type: Number }, // sq ft
  isOccupied: { type: Boolean, default: false },
  image: { type: String },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'Resident' }
}, { timestamps: true });

flatSchema.index({ society: 1, flatNumber: 1 }, { unique: true });

module.exports = mongoose.model('Flat', flatSchema);
