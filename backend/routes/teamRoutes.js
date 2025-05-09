const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

// Student-specific routes
router.post('/', teamController.createTeam);
router.get('/my-teams', teamController.getStudentTeams);
router.get('/tutor/:idTutor', teamController.getTeamsByTutorId);

// Evaluation routes
router.get('tutors/:id/evaluate', teamController.getTeamEvaluationPage); // Nouvelle route

// General routes
router.get('/tutors', teamController.getTutorsByClass);
router.get('/students', teamController.getStudentsByClass);
router.get('/', teamController.getAllTeams);
router.post('/confirm-delete', teamController.confirmOrDeleteTeam);
router.put('/assign-project', teamController.assignProjectToTeam);

// Team-specific routes (with :id)
router.get('/:id', teamController.getTeamById);
router.put('/:id', teamController.updateTeam);
router.delete('/:id', teamController.deleteTeam);

module.exports = router;