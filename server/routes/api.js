const express = require('express');
const router = express.Router();

const authCtrl = require('../controllers/auth.controller');
const { authenticate, authorizeRoles } = require('../middleware/auth');

const uploadCtrl = require('../controllers/upload.controller');
const processCtrl = require('../controllers/process.controller');
const voterCtrl = require('../controllers/voter.controller');
const dashboardCtrl = require('../controllers/dashboard.controller');
const templateCtrl = require('../controllers/template.controller');

// Public routes
router.post('/auth/login', authCtrl.login);

// Protected routes
router.use(authenticate);

// Admin only routes
router.post('/auth/employee', authorizeRoles('admin'), authCtrl.createEmployee);

router.post('/upload', authorizeRoles('admin'), uploadCtrl.uploadPDF);
router.post('/process/:id', authorizeRoles('admin'), processCtrl.processPDF);

router.get('/dashboard', authorizeRoles('admin'), dashboardCtrl.getDashboardStats);
router.get('/jobs', authorizeRoles('admin'), dashboardCtrl.getJobs);
router.delete('/pdf/:id', authorizeRoles('admin'), dashboardCtrl.deleteJob);

router.get('/voters', authorizeRoles('admin'), voterCtrl.getVoters);
router.get('/voters/:id', authorizeRoles('admin'), voterCtrl.getVoterById);
router.put('/voters/:id', authorizeRoles('admin'), voterCtrl.updateVoter);
router.delete('/voters/:id', authorizeRoles('admin'), voterCtrl.deleteVoter);

router.get('/templates', authorizeRoles('admin'), templateCtrl.getTemplates);
router.post('/templates', authorizeRoles('admin'), templateCtrl.saveTemplate);

module.exports = router;
