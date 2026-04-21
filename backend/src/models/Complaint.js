const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: {
    type: String,
    enum: ['Plumbing', 'Electricity', 'Security', 'Lift', 'Parking', 'Cleanliness', 'Noise', 'Other'],
    required: true
  },
  status: { type: String, enum: ['Open', 'In Progress', 'Resolved', 'Closed'], default: 'Open' },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Urgent'], default: 'Medium' },
  raisedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  society: { type: mongoose.Schema.Types.ObjectId, ref: 'Society', required: true },
  flat: { type: mongoose.Schema.Types.ObjectId, ref: 'Flat' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  images: [String],
  voiceNote: String,
  resolvedAt: Date,
  comments: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: String,
    createdAt: { type: Date, default: Date.now }
  }],
  aiDetectedCategory: String // from voice/NLP
}, { timestamps: true });

module.exports = mongoose.model('Complaint', complaintSchema);
