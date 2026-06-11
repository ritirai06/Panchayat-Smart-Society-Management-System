const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  society:   { type: mongoose.Schema.Types.ObjectId, ref: 'Society',  required: true },
  resident:  { type: mongoose.Schema.Types.ObjectId, ref: 'Resident', required: true },
  bookedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User',     required: true },
  facility:  { type: String, enum: ['Clubhouse', 'Gym', 'Swimming Pool', 'Community Hall', 'Sports Court', 'Terrace', 'Party Lawn'], required: true },
  date:      { type: String, required: true },   // YYYY-MM-DD
  timeSlot:  { type: String, required: true },   // e.g. "09:00-11:00"
  purpose:   { type: String },
  attendees: { type: Number, default: 1 },
  status:    { type: String, enum: ['Pending', 'Approved', 'Rejected', 'Cancelled'], default: 'Pending' },
  approvedBy:{ type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rejectionReason: { type: String },
}, { timestamps: true });

bookingSchema.index({ society: 1, facility: 1, date: 1, timeSlot: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
