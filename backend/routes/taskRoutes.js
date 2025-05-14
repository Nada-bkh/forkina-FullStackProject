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
// Nouvelle route pour filtrer les tâches
router.get('/filtered/tasks', taskController.getFilteredTasks);
router.get('/', authMiddleware, async (req, res) => {
    try {
      const { projectId } = req.query;
      if (!projectId) {
        return res.status(400).json({ message: 'Project ID is required' });
      }
      const tasks = await Task.find({ projectRef: projectId }).populate(
        'assignedTo',
        'firstName lastName'
      );
      res.json({ data: tasks });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
module.exports = router;