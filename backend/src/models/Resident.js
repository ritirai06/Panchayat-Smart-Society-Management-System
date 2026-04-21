const mongoose = require('mongoose');

const residentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String },
  type: { type: String, enum: ['owner', 'tenant'], default: 'owner' },
  flat: { type: mongoose.Schema.Types.ObjectId, ref: 'Flat', required: true },
  society: { type: mongoose.Schema.Types.ObjectId, ref: 'Society', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  familyMembers: [{
    name: String,
    relation: String,
    age: Number
  }],
  vehicleNumbers: [String],
  image: { type: String },
  moveInDate: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Resident', residentSchema);
