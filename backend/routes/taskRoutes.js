// routes/taskRoutes.js
const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const authMiddleware = require('../middlewares/authMiddleware');

// Apply auth middleware to all task routes
router.use(authMiddleware);

// Task CRUD routes
router.post('/', taskController.createTask);
router.get('/', taskController.getAllTasks);
router.get('/my-tasks', taskController.getMyTasks);
router.get('/:id', taskController.getTaskById);
router.put('/:id', taskController.updateTask);
router.delete('/:id', taskController.deleteTask);
router.get('/tutor/tasks', taskController.getTutorTasks);
router.get('/project/:projectId/tasks', taskController.getTasksByProject);
// Task comments
router.post('/:id/comments', taskController.addComment);
router.get('/:id/comments', taskController.getComments);

module.exports = router;