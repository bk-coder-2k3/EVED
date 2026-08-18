const express = require('express');
const router = express.Router();

const authCtrl = require('../controllers/auth.controller');
const { authenticate, authorizeRoles } = require('../middleware/auth');

const uploadCtrl = require('../controllers/upload.controller');
const processCtrl = require('../controllers/process.controller');
const voterCtrl = require('../controllers/voter.controller');
const dashboardCtrl = require('../controllers/dashboard.controller');
const templateCtrl = require('../controllers/template.controller');
const locationCtrl = require('../controllers/location.controller');

// Public routes
router.post('/auth/login', authCtrl.login);

// Protected routes
router.use(authenticate);

// Admin only routes
router.post('/auth/employee', authorizeRoles('admin'), authCtrl.createEmployee);
router.get('/auth/employee', authorizeRoles('admin'), authCtrl.getEmployees);
router.put('/auth/employee/:id', authorizeRoles('admin'), authCtrl.updateEmployee);
router.delete('/auth/employee/:id', authorizeRoles('admin'), authCtrl.deleteEmployee);
router.put('/auth/employee/:id/villages', authorizeRoles('admin'), authCtrl.assignVillages);

router.post('/upload', authorizeRoles('admin'), uploadCtrl.uploadPDF);
router.post('/process/:id', authorizeRoles('admin'), processCtrl.processPDF);

router.get('/dashboard', authorizeRoles('admin'), dashboardCtrl.getDashboardStats);
router.get('/jobs', authorizeRoles('admin'), dashboardCtrl.getJobs);
router.delete('/pdf/:id', authorizeRoles('admin'), dashboardCtrl.deleteJob);

router.get('/voters', authorizeRoles('admin'), voterCtrl.getVoters);
router.put('/voters/assign-location', authorizeRoles('admin'), voterCtrl.assignLocation);
router.get('/voters/:id', authorizeRoles('admin'), voterCtrl.getVoterById);
router.put('/voters/:id', authorizeRoles('admin'), voterCtrl.updateVoter);
router.delete('/voters/:id', authorizeRoles('admin'), voterCtrl.deleteVoter);

router.get('/templates', authorizeRoles('admin'), templateCtrl.getTemplates);
router.post('/templates', authorizeRoles('admin'), templateCtrl.saveTemplate);

// Employee specific routes
router.get('/employee/voters', authorizeRoles('employee'), voterCtrl.getAssignedVoters);
router.get('/employee/family-candidates', authorizeRoles('employee'), voterCtrl.getFamilyCandidates);
router.get('/employee/search-epic/:epicNumber', authorizeRoles('employee'), voterCtrl.searchByEpic);
router.put('/employee/survey/:id', authorizeRoles('employee'), voterCtrl.saveSurvey);

// Location hierarchy routes
router.get('/locations/zonals', authorizeRoles('admin', 'employee'), locationCtrl.getZonals);
router.get('/locations/taluks', authorizeRoles('admin', 'employee'), locationCtrl.getTaluks);
router.get('/locations/grams', authorizeRoles('admin', 'employee'), locationCtrl.getGrams);
router.get('/locations/booths', authorizeRoles('admin', 'employee'), locationCtrl.getBooths);
router.get('/locations/villages', authorizeRoles('admin', 'employee'), locationCtrl.getVillages);
router.get('/locations', authorizeRoles('admin'), locationCtrl.getAllLocations);
router.post('/locations', authorizeRoles('admin'), locationCtrl.createLocation);
router.post('/locations/bulk', authorizeRoles('admin'), locationCtrl.bulkCreateLocations);

module.exports = router;
