const mongoose = require('mongoose');

const pdfJobSchema = new mongoose.Schema({
  pdfName: { type: String, required: true },
  originalName: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  totalPages: { type: Number, default: 0 },
  processedPages: { type: Number, default: 0 },
  totalVotersExtracted: { type: Number, default: 0 },
  failedPages: [{ type: Number }],
  error: { type: String }
}, {
  timestamps: true
});

module.exports = mongoose.model('PDFJob', pdfJobSchema);
