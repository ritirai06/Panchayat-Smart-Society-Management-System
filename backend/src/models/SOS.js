const mongoose = require('mongoose');

const sosSchema = new mongoose.Schema({
  society:    { type: mongoose.Schema.Types.ObjectId, ref: 'Society',  required: true },
  raisedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User',     required: true },
  resident:   { type: mongoose.Schema.Types.ObjectId, ref: 'Resident' },
  flatNumber: { type: String },
  tower:      { type: String },
  type:       { type: String, enum: ['Security', 'Fire', 'Medical', 'Police', 'Guard', 'Other'], required: true },
  description:{ type: String },
  status:     { type: String, enum: ['Active', 'Acknowledged', 'Resolved'], default: 'Active' },
  acknowledgedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolvedAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('SOS', sosSchema);
