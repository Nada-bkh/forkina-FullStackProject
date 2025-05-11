const express = require('express');
const router = express.Router();
const { generateQuizFromRepo } = require('../controllers/quizController');

// Route pour générer un quiz à partir d'un dépôt
router.post('/from-repo', generateQuizFromRepo);

module.exports = router; 