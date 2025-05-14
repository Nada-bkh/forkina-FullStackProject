// routes/fileRoutes.js
const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const authMiddleware = require('../middlewares/authMiddleware');

// Apply auth middleware to all file routes
router.use(authMiddleware);

// Upload a file
router.post('/upload', fileController.upload.single('file'), fileController.uploadFile);

// Get files
router.get('/project/:projectId', fileController.getProjectFiles);
router.get('/task/:taskId', fileController.getTaskFiles);
router.get('/:id', fileController.getFileById);

// Download a file
router.get('/:id/download', fileController.downloadFile);

// Delete a file
router.delete('/:id', fileController.deleteFile);

module.exports = router; 