const express = require('express');
const { assignTeamsWithAI, submitFinalAssignment, getStudentProjects } = require('../controllers/assignmentController.js');
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();
router.use(authMiddleware);

router.post('/assign', assignTeamsWithAI);
router.post('/submit-final', submitFinalAssignment);

router.get('/team-projects', getStudentProjects);

module.exports = router;