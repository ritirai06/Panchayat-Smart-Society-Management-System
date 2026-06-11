const mongoose = require('mongoose');
const crypto = require('crypto');

const visitorSchema = new mongoose.Schema({
  society:      { type: mongoose.Schema.Types.ObjectId, ref: 'Society',  required: true },
  resident:     { type: mongoose.Schema.Types.ObjectId, ref: 'Resident', required: true },
  hostedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User',     required: true },
  flatNumber:   { type: String, required: true },
  visitorName:  { type: String, required: true, trim: true },
  visitorPhone: { type: String },
  visitorType:  { type: String, enum: ['Guest', 'Delivery', 'Driver', 'Maid', 'Vendor', 'Other'], default: 'Guest' },
  purpose:      { type: String },
  vehicleNumber:{ type: String },
  qrToken:      { type: String, unique: true, default: () => crypto.randomBytes(16).toString('hex') },
  validFrom:    { type: Date, default: Date.now },
  validUntil:   { type: Date, required: true },
  status:       { type: String, enum: ['Pending', 'Approved', 'Inside', 'Exited', 'Expired', 'Denied'], default: 'Approved' },
  entryTime:    { type: Date },
  exitTime:     { type: Date },
  gate:         { type: String, default: 'Main Gate' },
  isPreApproved:{ type: Boolean, default: false },
}, { timestamps: true });

visitorSchema.index({ society: 1, status: 1 });

module.exports = mongoose.model('Visitor', visitorSchema);
