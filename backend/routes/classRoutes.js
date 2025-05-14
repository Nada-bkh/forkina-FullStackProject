// routes/classRoutes.js
const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController');
const authMiddleware = require('../middlewares/authMiddleware');

// Apply auth middleware to all class routes
router.use(authMiddleware);

// Class CRUD routes
router.post('/', classController.createClass);
router.get('/', classController.getAllClasses);
router.get('/:id', classController.getClassById);
router.put('/:id', classController.updateClass);
router.delete('/:id', classController.deleteClass);

// Add students to a class
router.post('/add-students', classController.addStudentsToClass);

// Get all students for a tutor (across all their classes)
router.get('/tutor/students', classController.getAllStudentsForTutor);
router.get('/:classId/projects', authMiddleware, classController.getProjectsForClass);
module.exports = router;