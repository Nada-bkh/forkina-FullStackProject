const express = require('express');
const router = express.Router();
const projectApplicationController = require('../controllers/projectApplicationController');
const authMiddleware = require('../middlewares/authMiddleware');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Student can get their own applications
router.get('/', projectApplicationController.getStudentApplications);

// Submit a new application
router.post('/', projectApplicationController.submitApplication);

// Cancel an application
router.delete('/:id', projectApplicationController.cancelApplication);

module.exports = router; 