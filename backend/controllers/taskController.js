// controllers/taskController.js
const Task = require('../models/taskModel');
const Project = require('../models/projectModel');
const mongoose = require('mongoose');

// Create a new task
exports.createTask = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      status, 
      priority, 
      assignedTo, 
      dueDate, 
      startDate, 
      estimatedHours, 
      tags,
      projectRef,
      milestoneRef
    } = req.body;
    
    // Check if project exists
    const project = await Project.findById(projectRef);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Check if user has permission to create tasks in this project
    const isMember = project.members.some(m => m.user.toString() === req.user.id);
    const isTutor = project.tutorRef.toString() === req.user.id;
    const isAdmin = req.user.role === 'ADMIN';
    
    if (!isMember && !isTutor && !isAdmin) {
      return res.status(403).json({ error: 'You do not have permission to create tasks in this project' });
    }
    
    // Create new task
    const task = new Task({
      title,
      description,
      status: status || 'TODO',
      priority: priority || 'MEDIUM',
      createdBy: req.user.id,
      assignedTo,
      dueDate,
      startDate,
      estimatedHours,
      tags: tags || [],
      projectRef,
      milestoneRef
    });
    
    await task.save();
    
    // Populate user info
    await task.populate('createdBy', 'firstName lastName email');
    if (assignedTo) {
      await task.populate('assignedTo', 'firstName lastName email');
    }
    
    return res.status(201).json(task);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

// Get all tasks
exports.getAllTasks = async (req, res) => {
  try {
    const { projectId, status, priority, assignedTo, search } = req.query;
    const filter = {};
    
    // Filter by project
    if (projectId) {
      filter.projectRef = projectId;
    }
    
    // Filter by status
    if (status) {
      filter.status = status;
    }
    
    // Filter by priority
    if (priority) {
      filter.priority = priority;
    }
    
    // Filter by assigned user
    if (assignedTo) {
      filter.assignedTo = assignedTo;
    }
    
    // Search in title or description
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Get user's projects
    const userProjects = await Project.find({
      'members.user': req.user.id
    }).select('_id');
    
    const projectIds = userProjects.map(p => p._id);
    
    // Only show tasks from projects the user is a member of
    filter.projectRef = { $in: projectIds };
    
    const tasks = await Task.find(filter)
      .populate('createdBy', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email')
      .populate('projectRef', 'name status')
      .sort({ createdAt: -1 });
      
    return res.json(tasks);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Get task by ID
exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('createdBy', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email')
      .populate('projectRef', 'name status members tutorRef')
      .populate({
        path: 'comments.author',
        select: 'firstName lastName email'
      });
      
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
    
    return res.json(task);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Update task
exports.updateTask = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      status, 
      priority, 
      assignedTo, 
      dueDate, 
      startDate,
      completedDate, 
      estimatedHours,
      actualHours,
      tags
    } = req.body;
    
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Check if user has permission to update this task
    const project = await Project.findById(task.projectRef);
    if (!project) {
      return res.status(404).json({ error: 'Associated project not found' });
    }
    
    const isTutor = project.tutorRef.toString() === req.user.id;
    const isCreator = task.createdBy.toString() === req.user.id;
    const isAssigned = task.assignedTo && task.assignedTo.toString() === req.user.id;
    const isAdmin = req.user.role === 'ADMIN';
    
    // If task is assigned to someone, only that person, the task creator, tutors or admins can update it
    if (!isAssigned && !isCreator && !isTutor && !isAdmin) {
      return res.status(403).json({ error: 'You do not have permission to update this task' });
    }
    
    // If changing status to COMPLETED, record the completion date
    if (status === 'COMPLETED' && task.status !== 'COMPLETED') {
      task.completedDate = new Date();
    }
    
    // Update fields
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (status !== undefined) task.status = status;
    if (priority !== undefined) task.priority = priority;
    if (assignedTo !== undefined) task.assignedTo = assignedTo;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (startDate !== undefined) task.startDate = startDate;
    if (estimatedHours !== undefined) task.estimatedHours = estimatedHours;
    if (actualHours !== undefined) task.actualHours = actualHours;
    if (tags !== undefined) task.tags = tags;
    
    await task.save();
    
    // Update project progress
    await project.updateProgress();
    
    // Populate for response
    await task.populate('createdBy', 'firstName lastName email');
    await task.populate('assignedTo', 'firstName lastName email');
    await task.populate('projectRef', 'name status');
    
    return res.json(task);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

// Delete task
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Check if user has permission to delete this task
    const project = await Project.findById(task.projectRef);
    if (!project) {
      return res.status(404).json({ error: 'Associated project not found' });
    }
    
    const isTutor = project.tutorRef.toString() === req.user.id;
    const isCreator = task.createdBy.toString() === req.user.id;
    const isAdmin = req.user.role === 'ADMIN';
    
    if (!isCreator && !isTutor && !isAdmin) {
      return res.status(403).json({ error: 'You do not have permission to delete this task' });
    }
    
    await Task.findByIdAndDelete(req.params.id);
    
    // Update project progress
    await project.updateProgress();
    
    return res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Add comment to task
exports.addComment = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'Comment content is required' });
    }
    
    const task = await Task.findById(req.params.id);
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
      return res.status(403).json({ error: 'You do not have permission to comment on this task' });
    }
    
    // Add comment
    const comment = {
      author: req.user.id,
      content,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    task.comments.push(comment);
    await task.save();
    
    // Populate comment author
    await task.populate({
      path: 'comments.author',
      select: 'firstName lastName email'
    });
    
    // Return only the new comment
    const newComment = task.comments[task.comments.length - 1];
    
    return res.status(201).json(newComment);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

// Get task comments
exports.getComments = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate({
        path: 'comments.author',
        select: 'firstName lastName email'
      });
      
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
    
    return res.json(task.comments);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Get assigned tasks for current user
exports.getMyTasks = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {
      assignedTo: req.user.id
    };
    
    if (status) {
      filter.status = status;
    }
    
    const tasks = await Task.find(filter)
      .populate('createdBy', 'firstName lastName email')
      .populate('projectRef', 'name status')
      .sort({ dueDate: 1, priority: -1 });
      
    return res.json(tasks);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
