// controllers/projectController.js
const Project = require('../models/projectModel');
const User = require('../models/userModel');
const Task = require('../models/taskModel');

exports.createProject = async (req, res) => {
  try {
    const { name, description, startDate, endDate, tags, status } = req.body;

    // Ensure the creator is a tutor or admin (unchanged)
    if (req.user.role !== 'TUTOR' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Only tutors and admins can create projects' });
    }

    // Create new project (admins can create too, no change needed)
    const project = new Project({
      name,
      description,
      startDate,
      endDate,
      tags: tags || [],
      status: status || 'PENDING',
      tutorRef: req.user.role === 'TUTOR' ? req.user.id : null, // Admins don’t need to be tutorRef
      members: req.user.role === 'TUTOR' ? [{ user: req.user.id, role: 'TUTOR' }] : []
    });

    console.log('Creating project with data:', { name, description, startDate, endDate, tags, status, tutorRef: project.tutorRef });
    await project.save();

    await project.populate('tutorRef', 'firstName lastName email');
    await project.populate('members.user', 'firstName lastName email');

    return res.status(201).json(project);
  } catch (err) {
    console.error('Error creating project:', err);
    return res.status(400).json({ error: err.message });
  }
};

exports.getAllProjects = async (req, res) => {
  try {
    const { status, tutor, search } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (tutor) filter.tutorRef = tutor;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }

    // Students see only their projects, tutors/admins see all (modified)
    if (req.user.role === 'STUDENT') {
      filter['members.user'] = req.user.id;
    } else if (req.user.role === 'TUTOR') {
      filter.tutorRef = req.user.id; // Tutors see only their projects
    }
    // Admins see all projects (no filter added)

    const projects = await Project.find(filter)
        .populate('tutorRef', 'firstName lastName email')
        .populate('members.user', 'firstName lastName email userRole')
        .populate('teamRef')
        .sort({ createdAt: -1 });

    return res.json(projects);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
        .populate('tutorRef', 'firstName lastName email')
        .populate('members.user', 'firstName lastName email userRole')
        .populate('teamRef');

    if (!project) return res.status(404).json({ error: 'Project not found' });

    // Admins have unrestricted access (modified)
    const isMember = project.members.some(m => m.user._id.toString() === req.user.id);
    const isTutor = project.tutorRef && project.tutorRef._id.toString() === req.user.id;
    const isAdmin = req.user.role === 'ADMIN';

    if (!isMember && !isTutor && !isAdmin) {
      return res.status(403).json({ error: 'You do not have access to this project' });
    }

    const tasks = await Task.find({ projectRef: project._id })
        .populate('assignedTo', 'firstName lastName email')
        .populate('createdBy', 'firstName lastName email');

    return res.json({ project, tasks });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.updateProject = async (req, res) => {
  try {
    const { name, description, status, startDate, endDate, tags } = req.body;

    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    // Admins can update any project (modified)
    const isTutor = project.tutorRef && project.tutorRef.toString() === req.user.id;
    const isAdmin = req.user.role === 'ADMIN';

    if (!isTutor && !isAdmin) {
      return res.status(403).json({ error: 'You do not have permission to update this project' });
    }

    if (name) project.name = name;
    if (description) project.description = description;
    if (status) project.status = status;
    if (startDate) project.startDate = startDate;
    if (endDate) project.endDate = endDate;
    if (tags) project.tags = tags;

    await project.save();
    await project.populate('tutorRef', 'firstName lastName email');
    await project.populate('members.user', 'firstName lastName email');

    return res.json(project);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    // Admins can delete any project (modified)
    const isTutor = project.tutorRef && project.tutorRef.toString() === req.user.id;
    const isAdmin = req.user.role === 'ADMIN';

    if (!isTutor && !isAdmin) {
      return res.status(403).json({ error: 'You do not have permission to delete this project' });
    }

    await Task.deleteMany({ projectRef: project._id });
    await Project.findByIdAndDelete(req.params.id);

    return res.json({ message: 'Project and associated tasks deleted successfully' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Similar changes for addProjectMember and removeProjectMember
exports.addProjectMember = async (req, res) => {
  try {
    const { userId, role } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const isTutor = project.tutorRef && project.tutorRef.toString() === req.user.id;
    const isAdmin = req.user.role === 'ADMIN';

    if (!isTutor && !isAdmin) {
      return res.status(403).json({ error: 'You do not have permission to add members to this project' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (project.members.some(m => m.user.toString() === userId)) {
      return res.status(400).json({ error: 'User is already a member of this project' });
    }

    project.members.push({ user: userId, role: role || 'STUDENT', dateJoined: new Date() });
    await project.save();
    await project.populate('members.user', 'firstName lastName email');

    return res.json(project);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

exports.removeProjectMember = async (req, res) => {
  try {
    const { userId } = req.params;
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const isTutor = project.tutorRef && project.tutorRef.toString() === req.user.id;
    const isAdmin = req.user.role === 'ADMIN';

    if (!isTutor && !isAdmin) {
      return res.status(403).json({ error: 'You do not have permission to remove members from this project' });
    }

    if (project.tutorRef && project.tutorRef.toString() === userId) {
      return res.status(400).json({ error: 'Cannot remove the project tutor' });
    }

    project.members = project.members.filter(m => m.user.toString() !== userId);
    await project.save();

    return res.json({ message: 'Member removed successfully' });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

// getProjectStats (no change needed, admins already have access via getProjectById)
// Get project statistics
exports.getProjectStats = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Count tasks by status
    const tasks = await Task.find({ projectRef: project._id });
    
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;
    const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS').length;
    const todoTasks = tasks.filter(t => t.status === 'TODO').length;
    const reviewTasks = tasks.filter(t => t.status === 'REVIEW').length;
    
    // Update project progress
    await project.updateProgress();
    
    return res.json({
      totalTasks,
      completedTasks,
      inProgressTasks,
      todoTasks,
      reviewTasks,
      progressPercentage: project.progressPercentage,
      memberCount: project.members.length
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};