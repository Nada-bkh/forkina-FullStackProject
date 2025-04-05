const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const authMiddleware = require('../middlewares/authMiddleware');

// Apply auth middleware to all project routes
router.use(authMiddleware);

// Project CRUD routes
router.post('/', projectController.createProject);
router.get('/', projectController.getAllProjects);
router.get('/:id', projectController.getProjectById);
router.put('/:id', projectController.updateProject);
router.delete('/:id', projectController.deleteProject);

// Admin approval routes
router.post('/:id/approve', projectController.approveProject);
router.post('/:id/reject', projectController.rejectProject);
router.get('/recommended', projectController.getRecommendedProjects);

// Project member management
router.post('/:id/members', projectController.addProjectMember);
router.delete('/:id/members/:userId', projectController.removeProjectMember);

// Project statistics
router.get('/:id/stats', projectController.getProjectStats);

module.exports = router;