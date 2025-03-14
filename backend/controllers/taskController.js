const Task = require('../models/taskModel');
const Project = require('../models/projectModel');
const mongoose = require('mongoose');

exports.createTask = async (req, res) => {
  try {
    const { title, description, status, priority, assignedTo, dueDate, startDate, estimatedHours, projectRef, milestoneRef } = req.body;

    const project = await Project.findById(projectRef);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const isMember = project.members.some(m => m.user.toString() === req.user.id);
    const isTutor = project.tutorRef && project.tutorRef.toString() === req.user.id;
    const isAdmin = req.user.role === 'ADMIN';

    if (!isMember && !isTutor && !isAdmin) {
      return res.status(403).json({ error: 'You do not have permission to create tasks in this project' });
    }

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
      projectRef,
      milestoneRef
    });

    await task.save();
    await task.populate('createdBy', 'firstName lastName email');
    if (assignedTo) await task.populate('assignedTo', 'firstName lastName email');

    return res.status(201).json(task);
  } catch (err) {
    console.error('Error creating task:', err);
    return res.status(400).json({ error: err.message });
  }
};

exports.getAllTasks = async (req, res) => {
  try {
    const { projectId, status, priority, assignedTo, search } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }

    if (req.user.role === 'STUDENT') {
      const userProjects = await Project.find({ 'members.user': req.user.id }).select('_id');
      filter.projectRef = { $in: userProjects.map(p => p._id) };
    } else if (req.user.role === 'TUTOR') {
      const tutorProjects = await Project.find({ tutorRef: req.user.id }).select('_id');
      filter.projectRef = { $in: tutorProjects.map(p => p._id) };
    }
    // Admins see all tasks (no projectRef filter)

    if (projectId) filter.projectRef = projectId;

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

exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
        .populate('createdBy', 'firstName lastName email')
        .populate('assignedTo', 'firstName lastName email')
        .populate('projectRef', 'name status members tutorRef')
        .populate({ path: 'comments.author', select: 'firstName lastName email' });

    if (!task) return res.status(404).json({ error: 'Task not found' });

    const project = await Project.findById(task.projectRef);
    if (!project) return res.status(404).json({ error: 'Associated project not found' });

    const isMember = project.members.some(m => m.user.toString() === req.user.id);
    const isTutor = project.tutorRef && project.tutorRef.toString() === req.user.id;
    const isAdmin = req.user.role === 'ADMIN';

    if (!isMember && !isTutor && !isAdmin) return res.status(403).json({ error: 'You do not have access to this task' });

    return res.json(task);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const { title, description, status, priority, assignedTo, dueDate, startDate, completedDate, estimatedHours, actualHours, tags } = req.body;

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const project = await Project.findById(task.projectRef);
    if (!project) return res.status(404).json({ error: 'Associated project not found' });

    const isTutor = project.tutorRef && project.tutorRef.toString() === req.user.id;
    const isCreator = task.createdBy.toString() === req.user.id;
    const isAssigned = task.assignedTo && task.assignedTo.toString() === req.user.id;
    const isAdmin = req.user.role === 'ADMIN';

    if (!isAssigned && !isCreator && !isTutor && !isAdmin) {
      return res.status(403).json({ error: 'You do not have permission to update this task' });
    }

    if (status === 'COMPLETED' && task.status !== 'COMPLETED') task.completedDate = new Date();

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
    await project.updateProgress();

    await task.populate('createdBy', 'firstName lastName email');
    await task.populate('assignedTo', 'firstName lastName email');
    await task.populate('projectRef', 'name status');

    return res.json(task);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const project = await Project.findById(task.projectRef);
    if (!project) return res.status(404).json({ error: 'Associated project not found' });

    const isTutor = project.tutorRef && project.tutorRef.toString() === req.user.id;
    const isCreator = task.createdBy.toString() === req.user.id;
    const isAdmin = req.user.role === 'ADMIN';

    if (!isCreator && !isTutor && !isAdmin) {
      return res.status(403).json({ error: 'You do not have permission to delete this task' });
    }

    await Task.findByIdAndDelete(req.params.id);
    await project.updateProgress();

    return res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.addComment = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'Comment content is required' });
    
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    
    const project = await Project.findById(task.projectRef);
    if (!project) return res.status(404).json({ error: 'Associated project not found' });
    
    const isMember = project.members.some(m => m.user.toString() === req.user.id);
    const isTutor = project.tutorRef.toString() === req.user.id;
    const isAdmin = req.user.role === 'ADMIN';
    
    if (!isMember && !isTutor && !isAdmin) return res.status(403).json({ error: 'You do not have permission to comment on this task' });
    
    const comment = { author: req.user.id, content, createdAt: new Date(), updatedAt: new Date() };
    task.comments.push(comment);
    await task.save();
    
    await task.populate({ path: 'comments.author', select: 'firstName lastName email' });
    const newComment = task.comments[task.comments.length - 1];
    
    return res.status(201).json(newComment);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

exports.getComments = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate({ path: 'comments.author', select: 'firstName lastName email' });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    
    const project = await Project.findById(task.projectRef);
    if (!project) return res.status(404).json({ error: 'Associated project not found' });
    
    const isMember = project.members.some(m => m.user.toString() === req.user.id);
    const isTutor = project.tutorRef.toString() === req.user.id;
    const isAdmin = req.user.role === 'ADMIN';
    
    if (!isMember && !isTutor && !isAdmin) return res.status(403).json({ error: 'You do not have access to this task' });
    
    return res.json(task.comments);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.getMyTasks = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { assignedTo: req.user.id };
    if (status) filter.status = status;
    
    const tasks = await Task.find(filter)
      .populate('createdBy', 'firstName lastName email')
      .populate('projectRef', 'name status')
      .sort({ dueDate: 1, priority: -1 });
      
    return res.json(tasks);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.getTutorTasks = async (req, res) => {
  try {
    const tutorId = req.user.id;
    const projects = await Project.find({ tutorRef: tutorId });
    const projectIds = projects.map(p => p._id);
    const tasks = await Task.find({ projectRef: { $in: projectIds } })
      .populate('createdBy', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email')
      .populate('projectRef', 'name status');
    return res.json(tasks);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.getTasksByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ error: 'Invalid project ID format' });
    }

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const isMember = project.members.some(m => m.user.toString() === req.user.id);
    const isTutor = project.tutorRef && project.tutorRef.toString() === req.user.id;
    const isAdmin = req.user.role === 'ADMIN';

    if (!isMember && !isTutor && !isAdmin) {
      return res.status(403).json({ error: 'You do not have permission to view tasks for this project' });
    }

    const tasks = await Task.find({ projectRef: projectId })
        .populate('createdBy', 'firstName lastName email')
        .populate('assignedTo', 'firstName lastName email')
        .populate('projectRef', 'name status');

    return res.json(tasks);
  } catch (err) {
    console.error('Error in getTasksByProject:', err.stack);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};