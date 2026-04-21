const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['complaint', 'payment', 'announcement', 'reminder', 'system'], default: 'system' },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // null = broadcast
  society: { type: mongoose.Schema.Types.ObjectId, ref: 'Society' },
  isRead: { type: Boolean, default: false },
  readAt: Date,
  sentAt: { type: Date, default: Date.now },
  retryAfter: Date // for missed notification recall
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
