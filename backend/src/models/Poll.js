const mongoose = require('mongoose');

const pollSchema = new mongoose.Schema({
  society:     { type: mongoose.Schema.Types.ObjectId, ref: 'Society', required: true },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
  title:       { type: String, required: true, trim: true },
  description: { type: String },
  category:    { type: String, enum: ['Election', 'Maintenance', 'Event', 'Budget', 'Rule Change', 'Other'], default: 'Other' },
  options: [{
    text:  { type: String, required: true },
    votes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  }],
  endsAt:    { type: Date, required: true },
  isActive:  { type: Boolean, default: true },
  isAnonymous: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Poll', pollSchema);
