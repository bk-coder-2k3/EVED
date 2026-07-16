require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const os = require('os');

// Start Python OCR Microservice automatically
const startPythonService = () => {
  const pythonExecutable = os.platform() === 'win32'
    ? path.join(__dirname, '..', 'ocr_service', 'venv', 'Scripts', 'python.exe')
    : path.join(__dirname, '..', 'ocr_service', 'venv', 'bin', 'python');
  
  const ocrDir = path.join(__dirname, '..', 'ocr_service');

  if (!fs.existsSync(pythonExecutable)) {
    console.error('[OCR Service] Python virtual environment not found. Please set it up in the ocr_service folder.');
    return;
  }

  console.log(`[OCR Service] Starting...`);
  const pythonProcess = spawn(pythonExecutable, ['main.py'], { 
    cwd: ocrDir,
    env: {
      ...process.env,
      FLAGS_enable_pir_api: "0",
      FLAGS_use_mkldnn: "0"
    }
  });

  pythonProcess.stdout.on('data', (data) => {
    process.stdout.write(`[OCR]: ${data}`);
  });

  pythonProcess.stderr.on('data', (data) => {
    process.stderr.write(`[OCR ERR]: ${data}`);
  });

  // Ensure python process is killed when node process exits
  process.on('exit', () => pythonProcess.kill());
  process.on('SIGINT', () => {
    pythonProcess.kill();
    process.exit();
  });
  process.on('SIGTERM', () => {
    pythonProcess.kill();
    process.exit();
  });
};

startPythonService();

// Initialize app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files (for accessing images directly from frontend)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure upload directories exist
const uploadDirs = [
  'uploads',
  'uploads/pdf',
  'uploads/pages',
  'uploads/cards',
  'uploads/photos'
];

uploadDirs.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

// Import Routes
const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB successfully.');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err);
  });
