const express = require('express');
const router = express.Router();
const { generateQuizFromRepo } = require('../controllers/quizController');

router.post('/from-repo', generateQuizFromRepo);

module.exports = router; 