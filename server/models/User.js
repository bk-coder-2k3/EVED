const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  employeeId: { type: String, unique: true, sparse: true },
  name: { type: String },
  dateOfBirth: { type: Date },
  age: { type: Number },
  email: { type: String, unique: true, sparse: true },
  mobile: { type: String, unique: true, sparse: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'employee'], default: 'employee' },
  assignedVillages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Location' }]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
