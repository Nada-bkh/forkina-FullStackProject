// routes/studentResumeRoutes.js
const express = require('express');
const router = express.Router();
const studentResumeController = require('../controllers/studentResumeController');

router.post('/', studentResumeController.createStudentResume);
router.get('/', studentResumeController.getAllStudentResumes);
router.get('/:id', studentResumeController.getStudentResumeById);
router.put('/:id', studentResumeController.updateStudentResume);
router.delete('/:id', studentResumeController.deleteStudentResume);

module.exports = router;
