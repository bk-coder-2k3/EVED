const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  zonal: { type: String, required: true, index: true },
  taluk: { type: String, required: true, index: true },
  gram: { type: String, required: true, index: true },
  booth: { type: String, required: true, index: true },
  village: { type: String, required: true, index: true }
}, {
  timestamps: true
});

// Ensure uniqueness across the exact full path down to village
locationSchema.index({ zonal: 1, taluk: 1, gram: 1, booth: 1, village: 1 }, { unique: true });

module.exports = mongoose.model('Location', locationSchema);
