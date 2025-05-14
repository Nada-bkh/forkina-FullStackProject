// controllers/fileController.js
const File = require('../models/fileModel');
const Project = require('../models/projectModel');
const Task = require('../models/taskModel');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/projects');
    
    // Create the directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Create a unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${extension}`);
  }
});

// File filter to restrict file types
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/zip',
    'application/x-7z-compressed',
    'application/x-rar-compressed'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only documents, images, and archives are allowed.'), false);
  }
};

// Create multer upload instance
exports.upload = multer({ 
  storage,
  fileFilter,
  limits: { 
    fileSize: 10 * 1024 * 1024 // 10MB file size limit
  }
});

// Upload a file
exports.uploadFile = async (req, res) => {
  try {
    // Check if file exists in request
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const { projectId, taskId, description, isPublic, tags } = req.body;
    
    // Check if project exists
    const project = await Project.findById(projectId);
    if (!project) {
      // Delete the uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Check if user has access to this project
    const isMember = project.members.some(m => m.user.toString() === req.user.id);
    const isTutor = project.tutorRef.toString() === req.user.id;
    const isAdmin = req.user.role === 'ADMIN';
    
    if (!isMember && !isTutor && !isAdmin) {
      // Delete the uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(403).json({ error: 'You do not have permission to upload files to this project' });
    }
    
    // If taskId is provided, check if it exists and belongs to the project
    let task = null;
    if (taskId) {
      task = await Task.findById(taskId);
      if (!task || task.projectRef.toString() !== projectId) {
        // Delete the uploaded file
        fs.unlinkSync(req.file.path);
        return res.status(404).json({ error: 'Task not found or does not belong to the specified project' });
      }
    }
    
    // Create file record
    const file = new File({
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: req.file.path,
      mimetype: req.file.mimetype,
      size: req.file.size,
      description: description || '',
      uploadedBy: req.user.id,
      projectRef: projectId,
      taskRef: taskId || null,
      isPublic: isPublic === 'true' || isPublic === true,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : []
    });
    
    await file.save();
    
    // If file is attached to a task, update the task's attachments
    if (task) {
      task.attachments.push({
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: req.file.path,
        mimetype: req.file.mimetype,
        size: req.file.size,
        uploadedBy: req.user.id,
        uploadedAt: new Date()
      });
      
      await task.save();
    }
    
    // Populate user info
    await file.populate('uploadedBy', 'firstName lastName email');
    
    return res.status(201).json(file);
  } catch (err) {
    // Delete the uploaded file if there was an error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    
    return res.status(400).json({ error: err.message });
  }
};

// Get all files for a project
exports.getProjectFiles = async (req, res) => {
  try {
    const { projectId } = req.params;
    
    // Check if project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Check if user has access to this project
    const isMember = project.members.some(m => m.user.toString() === req.user.id);
    const isTutor = project.tutorRef.toString() === req.user.id;
    const isAdmin = req.user.role === 'ADMIN';
    
    if (!isMember && !isTutor && !isAdmin) {
      return res.status(403).json({ error: 'You do not have access to this project' });
    }
    
    // Get files for the project
    const files = await File.find({ projectRef: projectId })
      .populate('uploadedBy', 'firstName lastName email')
      .sort({ createdAt: -1 });
      
    return res.json(files);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Get all files for a task
exports.getTaskFiles = async (req, res) => {
  try {
    const { taskId } = req.params;
    
    // Check if task exists
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Check if user has access to this task's project
    const project = await Project.findById(task.projectRef);
    if (!project) {
      return res.status(404).json({ error: 'Associated project not found' });
    }
    
    const isMember = project.members.some(m => m.user.toString() === req.user.id);
    const isTutor = project.tutorRef.toString() === req.user.id;
    const isAdmin = req.user.role === 'ADMIN';
    
    if (!isMember && !isTutor && !isAdmin) {
      return res.status(403).json({ error: 'You do not have access to this task' });
    }
    
    // Get files for the task
    const files = await File.find({ taskRef: taskId })
      .populate('uploadedBy', 'firstName lastName email')
      .sort({ createdAt: -1 });
      
    return res.json(files);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Get file by ID
exports.getFileById = async (req, res) => {
  try {
    const file = await File.findById(req.params.id)
      .populate('uploadedBy', 'firstName lastName email');
      
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Check if file is public
    if (file.isPublic) {
      return res.json(file);
    }
    
    // Check if user has access to the file's project
    const project = await Project.findById(file.projectRef);
    if (!project) {
      return res.status(404).json({ error: 'Associated project not found' });
    }
    
    const isMember = project.members.some(m => m.user.toString() === req.user.id);
    const isTutor = project.tutorRef.toString() === req.user.id;
    const isAdmin = req.user.role === 'ADMIN';
    
    if (!isMember && !isTutor && !isAdmin) {
      return res.status(403).json({ error: 'You do not have access to this file' });
    }
    
    return res.json(file);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Download file
exports.downloadFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Check if file is public
    if (file.isPublic) {
      // Send the file
      return res.download(file.path, file.originalName);
    }
    
    // Check if user has access to the file's project
    const project = await Project.findById(file.projectRef);
    if (!project) {
      return res.status(404).json({ error: 'Associated project not found' });
    }
    
    const isMember = project.members.some(m => m.user.toString() === req.user.id);
    const isTutor = project.tutorRef.toString() === req.user.id;
    const isAdmin = req.user.role === 'ADMIN';
    
    if (!isMember && !isTutor && !isAdmin) {
      return res.status(403).json({ error: 'You do not have access to this file' });
    }
    
    // Send the file
    return res.download(file.path, file.originalName);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Delete file
exports.deleteFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Check if user has permission to delete this file
    const isOwner = file.uploadedBy.toString() === req.user.id;
    
    // Check if user is a tutor or admin for the project
    const project = await Project.findById(file.projectRef);
    if (!project) {
      return res.status(404).json({ error: 'Associated project not found' });
    }
    
    const isTutor = project.tutorRef.toString() === req.user.id;
    const isAdmin = req.user.role === 'ADMIN';
    
    if (!isOwner && !isTutor && !isAdmin) {
      return res.status(403).json({ error: 'You do not have permission to delete this file' });
    }
    
    // Delete from task's attachments if associated with a task
    if (file.taskRef) {
      const task = await Task.findById(file.taskRef);
      if (task) {
        task.attachments = task.attachments.filter(a => a.filename !== file.filename);
        await task.save();
      }
    }
    
    // Delete the physical file
    fs.unlinkSync(file.path);
    
    // Delete the file record
    await File.findByIdAndDelete(req.params.id);
    
    return res.json({ message: 'File deleted successfully' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}; 