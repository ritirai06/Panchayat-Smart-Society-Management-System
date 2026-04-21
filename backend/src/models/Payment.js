const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  resident: { type: mongoose.Schema.Types.ObjectId, ref: 'Resident', required: true },
  flat: { type: mongoose.Schema.Types.ObjectId, ref: 'Flat', required: true },
  society: { type: mongoose.Schema.Types.ObjectId, ref: 'Society', required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['Maintenance', 'Parking', 'Amenity', 'Fine', 'Other'], default: 'Maintenance' },
  status: { type: String, enum: ['Pending', 'Paid', 'Overdue', 'Waived'], default: 'Pending' },
  month: { type: String, required: true }, // "2024-01"
  dueDate: { type: Date, required: true },
  paidAt: Date,
  transactionId: String,
  paymentMethod: { type: String, enum: ['Online', 'Cash', 'Cheque', 'UPI'], default: 'Online' },
  reminderSent: { type: Boolean, default: false },
  notes: String
}, { timestamps: true });

paymentSchema.index({ resident: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('Payment', paymentSchema);
