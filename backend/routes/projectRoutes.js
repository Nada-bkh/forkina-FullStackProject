// backend/routes/projectRoutes.js
const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const authMiddleware = require('../middlewares/authMiddleware');
const { validationResult, body } = require("express-validator");

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Create a new project
router.post('/', projectController.createProject);

// Get all projects (filtered based on user role)
router.get('/', projectController.getAllProjects);

// Get a specific project by ID
router.get('/:id', projectController.getProjectById);

// Update a project by ID
router.put('/:id', projectController.updateProject);

// Delete a project by ID
router.delete('/:id', projectController.deleteProject);

// Add a member to a project
router.post('/:id/members', projectController.addProjectMember);

// Remove a member from a project
router.delete('/:id/members/:userId', projectController.removeProjectMember);

// Get project statistics
router.get('/:id/stats', projectController.getProjectStats);

// Assign classes to a project
router.put('/assign-classes', projectController.assignClassesToProject);

// Get predicted completion date for a project (AI-enhanced)
router.get('/:projectId/predicted-completion', projectController.getPredictedCompletion);

// Get risk alerts for a project (AI-enhanced)
router.get('/:projectId/risk-alerts', projectController.getRiskAlerts);

// Get available projects for assignment (e.g., to teams)
router.get('/available', projectController.getAvailableProjects);

// Assign a team to a project (updated route)
router.put('/:projectId/assignTeam', [
    body('teamId').optional().isMongoId().withMessage('Invalid team ID') // teamId is optional (can be null to unassign)
], (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
    }
    next();
}, projectController.assignTeamToProject);

module.exports = router;