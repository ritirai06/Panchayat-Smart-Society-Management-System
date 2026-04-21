const mongoose = require('mongoose');

const societySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  totalFlats: { type: Number, default: 0 },
  amenities: [String],
  rules: { type: String }, // plain text bylaws
  rulesEmbedding: [Number], // legacy single vector (kept for compatibility)
  bylawChunks: [{ text: String, embedding: [Number] }], // per-chunk embeddings for semantic search
  maintenanceAmount: { type: Number, default: 2000 },
  logo: { type: String },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Society', societySchema);
