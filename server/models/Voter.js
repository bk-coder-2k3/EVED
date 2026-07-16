const mongoose = require('mongoose');

const voterSchema = new mongoose.Schema({
  serialNumber: { type: Number },
  epicNumber: { type: String, index: true },
  name: { type: String, index: true },
  relationName: { type: String },
  relationType: { type: String },
  houseNumber: { type: String, index: true },
  age: { type: Number },
  gender: { type: String },
  photo: { type: String }, // Path to cropped photo
  voterCardImage: { type: String }, // Path to full card crop
  pdfName: { type: String },
  pageNumber: { type: Number }
}, {
  timestamps: true
});

module.exports = mongoose.model('Voter', voterSchema);
