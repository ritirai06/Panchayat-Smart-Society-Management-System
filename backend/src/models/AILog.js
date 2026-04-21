const mongoose = require('mongoose');

const aiLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  society: { type: mongoose.Schema.Types.ObjectId, ref: 'Society' },
  type: { type: String, enum: ['chat', 'summarize', 'voice', 'bylaw', 'categorize'], required: true },
  input: { type: String, required: true },
  output: { type: String, required: true },
  tokensUsed: Number,
  model: { type: String, default: 'gpt-3.5-turbo' },
  latencyMs: Number
}, { timestamps: true });

module.exports = mongoose.model('AILog', aiLogSchema);
