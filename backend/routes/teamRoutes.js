// routes/teamRoutes.js
const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

// Student-specific routes
router.post('/', teamController.createTeam);
router.get('/my-teams', teamController.getStudentTeams);
router.put('/:id', teamController.updateTeam);
router.delete('/:id', teamController.deleteTeam);

// General routes
router.get('/', teamController.getAllTeams);
router.get('/:id', teamController.getTeamById);
router.post('/confirm-delete', teamController.confirmOrDeleteTeam); // New route
router.put('/assign-project',  teamController.assignProjectToTeam); // New route
module.exports = router;
