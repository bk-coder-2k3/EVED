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
  pageNumber: { type: Number },
  locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', default: null },

  // Survey Data & Lock
  phoneNumber: { type: String },
  alternatePhoneNumber: { type: String },
  currentLocation: { type: String }, // 'In Village', 'Out of Village'
  outOfVillageSpecify: { type: String },
  possibility: { type: String },
  prevP: { type: String },
  dd: { type: String },
  religion: { type: String },
  caste: { type: String },
  status: { type: String },
  surveyStatus: { type: String, enum: ['Pending', 'Completed'], default: 'Pending' },
  familyMemberIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Voter' }],
  
  surveyedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  surveyedAt: { type: Date }
}, {
  timestamps: true
});

module.exports = mongoose.model('Voter', voterSchema);
