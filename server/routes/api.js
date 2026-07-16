const express = require('express');
const router = express.Router();

const uploadCtrl = require('../controllers/upload.controller');
const processCtrl = require('../controllers/process.controller');
const voterCtrl = require('../controllers/voter.controller');
const dashboardCtrl = require('../controllers/dashboard.controller');
const templateCtrl = require('../controllers/template.controller');

// Upload & Process
router.post('/upload', uploadCtrl.uploadPDF);
router.post('/process/:id', processCtrl.processPDF);

// Dashboard / Jobs
router.get('/dashboard', dashboardCtrl.getDashboardStats);
router.get('/jobs', dashboardCtrl.getJobs);
router.delete('/pdf/:id', dashboardCtrl.deleteJob);

// Voters
router.get('/voters', voterCtrl.getVoters);
router.get('/voters/:id', voterCtrl.getVoterById);
router.put('/voters/:id', voterCtrl.updateVoter);
router.delete('/voters/:id', voterCtrl.deleteVoter);

// Templates
router.get('/templates', templateCtrl.getTemplates);
router.post('/templates', templateCtrl.saveTemplate);

module.exports = router;
