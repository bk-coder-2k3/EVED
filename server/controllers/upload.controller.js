const multer = require('multer');
const path = require('path');
const fs = require('fs');
const PDFJob = require('../models/PDFJob');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/pdf'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
}).single('file');

exports.uploadPDF = (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload a file' });
    }

    try {
      // Create a new Job entry
      const newJob = new PDFJob({
        pdfName: req.file.filename,
        originalName: req.file.originalname,
        status: 'pending'
      });
      await newJob.save();

      res.status(200).json({ message: 'File uploaded successfully', job: newJob });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error saving job record' });
    }
  });
};
