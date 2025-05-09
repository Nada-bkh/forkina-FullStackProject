const express = require('express');
const { assignTeamsWithAI, submitFinalAssignment } = require('../controllers/assignmentController.js');

const router = express.Router();

router.post('/assign', assignTeamsWithAI);
router.post('/submit-final', submitFinalAssignment);
module.exports = router;