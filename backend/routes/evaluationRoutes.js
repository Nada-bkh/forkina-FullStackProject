// routes/evaluationRoutes.js
const express = require('express');
const router = express.Router();
const evaluationController = require('../controllers/evaluationController');

router.post('/:teamId', evaluationController.createEvaluation);
router.get('/:id', evaluationController.getEvaluationById);
router.put('/:id', evaluationController.updateEvaluation);
router.delete('/:id', evaluationController.deleteEvaluation);
router.get('/team/:teamId', evaluationController.getEvaluationByTeamId);

module.exports = router;
