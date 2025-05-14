// routes/tutorResumeRoutes.js
const express = require('express');
const router = express.Router();
const tutorResumeController = require('../controllers/tutorResumeController');

router.post('/', tutorResumeController.createTutorResume);
router.get('/', tutorResumeController.getAllTutorResumes);
router.get('/:id', tutorResumeController.getTutorResumeById);
router.put('/:id', tutorResumeController.updateTutorResume);
router.delete('/:id', tutorResumeController.deleteTutorResume);

module.exports = router;
