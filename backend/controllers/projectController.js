// backend/controllers/projectController.js
const mongoose = require('mongoose');
const Project = require('../models/projectModel');
const User = require('../models/userModel');
const Task = require('../models/taskModel');
const Class = require('../models/classModel');
const Team = require('../models/teamModel');
const axios = require('axios');

exports.createProject = async (req, res) => {
    try {
        const {name, description, startDate, endDate, tags, status, classIds} = req.body;

        if (req.user.role !== 'TUTOR' && req.user.role !== 'ADMIN') {
            return res.status(403).json({message: 'Only tutors and admins can create projects'});
        }

        if (req.user.role !== 'ADMIN' && classIds && classIds.length > 0) {
            return res.status(403).json({message: 'Only admins can assign classes to a project during creation'});
        }

        if (classIds && Array.isArray(classIds)) {
            const classes = await Class.find({_id: {$in: classIds}});
            if (classes.length !== classIds.length) {
                return res.status(400).json({message: 'One or more class IDs are invalid'});
            }
        }

        const approvalStatus = req.user.role === 'TUTOR' ? 'RECOMMENDED' : 'APPROVED';

        const project = new Project({
            name,
            description,
            startDate,
            endDate,
            tags: tags || [],
            status: status || 'PENDING',
            approvalStatus,
            tutorRef: req.user.role === 'TUTOR' ? req.user.id : null,
            members: req.user.role === 'TUTOR' ? [{user: req.user.id, role: 'TUTOR'}] : [],
            classes: req.user.role === 'ADMIN' ? (classIds || []) : [],
        });

        console.log('Creating project with data:', {
            name,
            description,
            startDate,
            endDate,
            tags,
            status,
            tutorRef: project.tutorRef,
            classes: project.classes,
            approvalStatus
        });
        await project.save();

        await project.populate('tutorRef', 'firstName lastName email');
        await project.populate('members.user', 'firstName lastName email');
        await project.populate('classes', 'name description');

        return res.status(201).json(project);
    } catch (err) {
        console.error('Error creating project:', err);
        return res.status(400).json({error: err.message});
    }
};

exports.getAllProjects = async (req, res) => {
    try {
        const {status, tutor, search} = req.query;
        const filter = {};

        if (status) filter.status = status;
        if (tutor) filter.tutorRef = tutor;
        if (search) {
            filter.$or = [
                {name: {$regex: search, $options: 'i'}},
                {description: {$regex: search, $options: 'i'}},
                {tags: {$regex: search, $options: 'i'}}
            ];
        }

        if (req.user.role === 'STUDENT') {
            filter.approvalStatus = 'APPROVED';

        } else if (req.user.role === 'TUTOR') {
            filter.tutorRef = req.user.id;
        }

        const projects = await Project.find(filter)
            .populate('tutorRef', 'firstName lastName email')
            .populate('members.user', 'firstName lastName email userRole')
            .populate('teamRef')
            .populate('classes', 'name description')
            .sort({createdAt: -1});

        // console.log('Projects found:', projects);
        return res.json(projects);
    } catch (err) {
        console.error('Error in getAllProjects:', err);
        return res.status(500).json({error: err.message});
    }
};

exports.getProjectById = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate('tutorRef', 'firstName lastName email')
            .populate('members.user', 'firstName lastName email userRole')
            .populate({
                path: 'teamRef',
                populate: {path: 'members.user', select: 'firstName lastName email'}
            })
            .populate('classes', 'name description');

        if (!project) return res.status(404).json({error: 'Project not found'});

        let hasAccess = false;
        if (req.user.role === 'ADMIN') {
            hasAccess = true;
        } else if (req.user.role === 'TUTOR' && project.tutorRef &&
            project.tutorRef._id.toString() === req.user.id) {
            hasAccess = true;
        } else if (req.user.role === 'STUDENT') {
            if (project.approvalStatus === 'APPROVED') {
                hasAccess = true;
            } else {
                const user = await User.findById(req.user.id).select('classe');
                if (
                    (user && user.classe && project.classes.some(
                        cls => cls._id.toString() === user.classe.toString())) ||
                    (project.teamRef && project.teamRef.some(team => team.members &&
                        team.members.some(member => member.user && member.user._id.toString() === req.user.id)))
                ) {
                    hasAccess = true;
                }
            }
        }

        if (!hasAccess) {
            return res.status(403).json({error: 'You do not have access to this project'});
        }

        if (project.approvalStatus !== 'APPROVED' && req.user.role === 'STUDENT' &&
            !(project.teamRef && project.teamRef.some(team => team.members &&
                team.members.some(member => member.user && member.user._id.toString() === req.user.id)))) {
            return res.status(403).json({error: 'This project is not yet approved'});
        }

        const tasks = await Task.find({projectRef: project._id})
            .populate('assignedTo', 'firstName lastName email')
            .populate('createdBy', 'firstName lastName email');

        return res.json({project, tasks});
    } catch (error) {
        return res.status(500).json({error: error.message});
    }
};

exports.updateProject = async (req, res) => {
    try {
        const projectId = req.params.id;

        // Validate projectId
        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            return res.status(400).json({error: 'Invalid project ID'});
        }

        const {name, description, status, startDate, endDate, tags, classIds, teamIds} = req.body;

        const project = await Project.findById(projectId);
        if (!project) return res.status(404).json({error: 'Project not found'});

        // Access control
        let hasAccess = false;
        if (req.user.role === 'ADMIN') {
            hasAccess = true;
        } else if (req.user.role === 'TUTOR' && project.tutorRef && project.tutorRef.toString() === req.user.id) {
            // Tutors can only update projects that are not yet approved
            if (project.approvalStatus === 'APPROVED') {
                return res.status(403).json({error: 'Approved projects can only be updated by admins'});
            }
            hasAccess = true;
        } else if (req.user.role === 'STUDENT') {
            const user = await User.findById(req.user.id).select('classe');
            if (user && user.classe && project.classes.some(cls => cls.toString() === user.classe.toString())) {
                hasAccess = true;
            }
        }

        if (!hasAccess) {
            return res.status(403).json({error: 'You do not have permission to update this project'});
        }

        // Only admins can update classIds and teamIds
        if (req.user.role !== 'ADMIN' && (classIds || teamIds)) {
            return res.status(403).json({error: 'Only admins can assign classes or teams to a project'});
        }

        if (name) project.name = name;
        if (description) project.description = description;
        if (status) project.status = status;
        if (startDate) project.startDate = startDate;
        if (endDate) project.endDate = endDate;
        if (tags) project.tags = tags;

        if (classIds && req.user.role === 'ADMIN') {
            const classes = await Class.find({_id: {$in: classIds}});
            if (classes.length !== classIds.length) {
                return res.status(400).json({message: 'One or more class IDs are invalid'});
            }
            project.classes = classIds;
        }

        if (teamIds && req.user.role === 'ADMIN') {
            const teams = await Team.find({_id: {$in: teamIds}});
            if (teams.length !== teamIds.length) {
                return res.status(400).json({message: 'One or more team IDs are invalid'});
            }
            project.teamRef = teamIds;

            // Update project members based on the teams
            const teamMembers = await Team.find({_id: {$in: project.teamRef}})
                .populate('members.user', 'firstName lastName email');
            const members = teamMembers.flatMap(team =>
                team.members
                    .filter(member => member.user != null)
                    .map(member => ({
                        user: member.user._id,
                        role: 'STUDENT',
                        dateJoined: new Date()
                    }))
            );

            // Remove existing student members and add new ones
            project.members = project.members.filter(member => member.role !== 'STUDENT');
            project.members.push(...members);
        } else if (teamIds && teamIds.length === 0 && req.user.role === 'ADMIN') {
            project.teamRef = [];
            project.members = project.members.filter(member => member.role !== 'STUDENT');
        }

        await project.save();
        await project.populate('tutorRef', 'firstName lastName email');
        await project.populate('members.user', 'firstName lastName email');
        await project.populate('teamRef', 'name');
        await project.populate('classes', 'name description');

        return res.json(project);
    } catch (err) {
        console.error('Error updating project:', err);
        return res.status(500).json({error: 'Server error', message: err.message});
    }
};

exports.deleteProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({error: 'Project not found'});

        const isTutor = project.tutorRef && project.tutorRef.toString() === req.user.id;
        const isAdmin = req.user.role === 'ADMIN';

        if (!isTutor && !isAdmin) {
            return res.status(403).json({error: 'You do not have permission to delete this project'});
        }

        await Task.deleteMany({projectRef: project._id});
        await Project.findByIdAndDelete(req.params.id);

        return res.json({message: 'Project and associated tasks deleted successfully'});
    } catch (err) {
        return res.status(500).json({error: err.message});
    }
};

exports.approveProject = async (req, res) => {
    try {
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({error: 'Only admins can approve projects'});
        }

        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({error: 'Project not found'});

        if (project.approvalStatus !== 'RECOMMENDED') {
            return res.status(400).json({error: 'Only recommended projects can be approved'});
        }

        project.approvalStatus = 'APPROVED';
        await project.save();
        await project.populate('tutorRef', 'firstName lastName email');
        await project.populate('members.user', 'firstName lastName email');
        await project.populate('teamRef', 'name');
        await project.populate('classes', 'name description');
        return res.json(project);
    } catch (err) {
        return res.status(500).json({error: err.message});
    }
};

exports.rejectProject = async (req, res) => {
    try {
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({error: 'Only admins can reject projects'});
        }

        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({error: 'Project not found'});

        if (project.approvalStatus !== 'RECOMMENDED') {
            return res.status(400).json({error: 'Only recommended projects can be rejected'});
        }

        project.approvalStatus = 'REJECTED';
        await project.save();
        await project.populate('tutorRef', 'firstName lastName email');
        await project.populate('members.user', 'firstName lastName email');
        await project.populate('teamRef', 'name');
        await project.populate('classes', 'name description');
        return res.json(project);
    } catch (err) {
        return res.status(500).json({error: err.message});
    }
};

// Existing functions remain unchanged below
exports.addProjectMember = async (req, res) => {
    try {
        const {userId, role} = req.body;
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({error: 'Project not found'});

        const isTutor = project.tutorRef && project.tutorRef.toString() === req.user.id;
        const isAdmin = req.user.role === 'ADMIN';

        if (!isTutor && !isAdmin) {
            return res.status(403).json({error: 'You do not have permission to add members to this project'});
        }

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({error: 'User not found'});
        if (project.members.some(m => m.user.toString() === userId)) {
            return res.status(400).json({error: 'User is already a member of this project'});
        }

        project.members.push({user: userId, role: role || 'STUDENT', dateJoined: new Date()});
        await project.save();
        await project.populate('members.user', 'firstName lastName email');

        return res.json(project);
    } catch (err) {
        return res.status(400).json({error: err.message});
    }
};

exports.removeProjectMember = async (req, res) => {
    try {
        const {userId} = req.params;
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({error: 'Project not found'});

        const isTutor = project.tutorRef && project.tutorRef.toString() === req.user.id;
        const isAdmin = req.user.role === 'ADMIN';

        if (!isTutor && !isAdmin) {
            return res.status(403).json({error: 'You do not have permission to remove members from this project'});
        }

        if (project.tutorRef && project.tutorRef.toString() === userId) {
            return res.status(400).json({error: 'Cannot remove the project tutor'});
        }

        project.members = project.members.filter(m => m.user.toString() !== userId);
        await project.save();

        return res.json({message: 'Member removed successfully'});
    } catch (err) {
        return res.status(400).json({error: err.message});
    }
};

exports.getProjectStats = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).json({error: 'Project not found'});
        }

        const tasks = await Task.find({projectRef: project._id});

        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;
        const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS').length;
        const todoTasks = tasks.filter(t => t.status === 'TODO').length;
        const reviewTasks = tasks.filter(t => t.status === 'REVIEW').length;

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
        return res.status(500).json({error: err.message});
    }
};

exports.assignClassesToProject = async (req, res) => {
    try {
        const {projectId} = req.params;
        const {classIds} = req.body;

        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            return res.status(400).json({error: 'Invalid project ID'});
        }

        const project = await Project.findById(projectId);
        if (!project) return res.status(404).json({error: 'Project not found'});

        const isTutor = project.tutorRef && project.tutorRef.toString() === req.user.id;
        const isAdmin = req.user.role === 'ADMIN';

        if (!isTutor && !isAdmin) {
            return res.status(403).json({error: 'You do not have permission to assign classes to this project'});
        }

        let classes = [];
        if (Array.isArray(classIds) && classIds.length > 0) {
            classes = await Class.find({_id: {$in: classIds}});
            if (classes.length !== classIds.length) {
                const invalidIds = classIds.filter(id => !classes.some(cls => cls._id.toString() === id));
                return res.status(400).json({message: 'One or more class IDs are invalid', invalidIds});
            }
            project.classes = classIds;
        } else {
            project.classes = [];
        }

        await project.save({validateBeforeSave: true});

        const updatedProject = await Project.findById(projectId)
            .populate('classes', 'name description')
            .populate('members.user', 'firstName lastName email');

        return res.json(updatedProject);
    } catch (err) {
        console.error('Error in assignClassesToProject:', err);
        return res.status(400).json({error: err.message});
    }
};

const calculatePredictedCompletion = async (projectId) => {
    console.log(`Starting calculatePredictedCompletion for projectId: ${projectId}`);

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        console.error(`Invalid projectId: ${projectId}`);
        throw new Error('Invalid project ID');
    }

    const project = await Project.findById(projectId);
    if (!project) {
        console.error(`Project not found for projectId: ${projectId}`);
        throw new Error('Project not found');
    }

    if (project.progressPercentage === 100) {
        console.log(`Project ${projectId} is already completed. No need for prediction.`);
        return new Date().toISOString();
    }

    if (!project.progressHistory || project.progressHistory.length < 2) {
        console.log(`Project ${projectId} has insufficient progress history: 
        ${project.progressHistory?.length || 0} entries`);
        return null;
    }

    const isValidHistory = project.progressHistory.every(entry => {
        const date = new Date(entry.date);
        const isValidDate = !isNaN(date.getTime());
        const isValidProgress = typeof entry.progress === 'number'
            && entry.progress >= 0 && entry.progress <= 100;
        return isValidDate && isValidProgress;
    });

    if (!isValidHistory) {
        console.error(`Project ${projectId} has invalid progress history format:`, project.progressHistory);
        throw new Error('Invalid progress history format');
    }

    try {
        console.log(`Sending request to AI service for project ${projectId}:`, project.progressHistory);
        const response = await axios.post('http://localhost:5000/forecast', {
            progressHistory: project.progressHistory
        }, {
            timeout: 10000
        });

        console.log(`Received response from AI service for project ${projectId}:`, response.data);
        if (!response.data || typeof response.data.predictedCompletionDate === 'undefined') {
            throw new Error('Invalid response from AI service');
        }

        return response.data.predictedCompletionDate;
    } catch (error) {
        console.error(`Failed to get predicted completion for project ${projectId}:`, {
            message: error.message,
            response: error.response ? {status: error.response.status, data: error.response.data} :
                'No response data'
        });
        throw new Error('Failed to get predicted completion from AI service: ' + error.message);
    }
};

const identifyRiskAlerts = async (projectId) => {
    const tasks = await Task.find({projectRef: projectId});
    const overdueTasks = tasks.filter(task => task.status !== 'COMPLETED' && new Date(task.dueDate) < new Date());
    if (overdueTasks.length > 0) {
        return `Warning: ${overdueTasks.length} task(s) are overdue.`;
    }
    return null;
};

exports.getPredictedCompletion = async (req, res) => {
    try {
        const project = await Project.findById(req.params.projectId);
        if (!project) {
            return res.status(404).json({error: 'Project not found'});
        }

        if (project.progressPercentage === 100) {
            return res.json({
                predictedCompletionDate: project.endDate ? project.endDate.toISOString() : null,
                message: 'Project is complete'
            });
        }

        if (!project.progressHistory || project.progressHistory.length < 2) {
            return res.json({
                predictedCompletionDate: null,
                message: 'Insufficient data for prediction'
            });
        }

        try {
            const response = await axios.post('http://localhost:5000/forecast', {
                progressHistory: project.progressHistory
            }, {
                timeout: 5000
            });

            return res.json({
                predictedCompletionDate: response.data.predictedCompletionDate,
                message: response.data.message || null
            });
        } catch (aiError) {
            console.error('AI service error:', aiError.message);
            return res.json({
                predictedCompletionDate: null,
                message: 'Prediction service temporarily unavailable',
                fallback: true
            });
        }
    } catch (error) {
        console.error('Error getting predicted completion:', error);
        return res.status(500).json({
            error: 'Failed to get predicted completion',
            message: 'Internal server error occurred'
        });
    }
};

exports.getRiskAlerts = async (req, res) => {
    try {
        console.log(`Received request for getRiskAlerts with projectId: ${req.params.projectId}`);

        const project = await Project.findById(req.params.projectId);
        if (!project) {
            return res.status(404).json({error: 'Project not found'});
        }

        let hasAccess = false;
        if (req.user.role === 'ADMIN') {
            hasAccess = true;
        } else if (req.user.role === 'TUTOR' && project.tutorRef && project.tutorRef.toString() === req.user.id) {
            hasAccess = true;
        } else if (req.user.role === 'STUDENT') {
            const user = await User.findById(req.user.id).select('classe');
            if (user && user.classe && project.classes.some(cls => cls.toString() === user.classe.toString())) {
                hasAccess = true;
            }
        }

        if (!hasAccess) {
            return res.status(403).json({error: 'You do not have access to this project'});
        }

        const alert = await identifyRiskAlerts(req.params.projectId);
        res.json({alert});
    } catch (error) {
        console.error(`Error in getRiskAlerts for project ${req.params.projectId}:`, {
            message: error.message,
            stack: error.stack
        });
        res.status(500).json({message: 'Error identifying risk alerts', error: error.message});
    }
};

exports.getProjectsForClass = async (req, res) => {
    try {
        const {classId} = req.params;

        if (!mongoose.Types.ObjectId.isValid(classId)) {
            return res.status(400).json({error: 'Invalid class ID'});
        }

        const filter = {classes: classId};

        if (req.user.role === 'TUTOR') {
            filter.tutorRef = req.user.id;
        } else if (req.user.role === 'STUDENT') {
            const user = await User.findById(req.user.id).select('classe');
            if (!user || !user.classe || user.classe.toString() !== classId) {
                return res.status(403).json({error: 'You do not have access to projects in this class'});
            }
            filter.approvalStatus = 'APPROVED'; // Students only see approved projects
        }

        const projects = await Project.find(filter)
            .populate('tutorRef', 'firstName lastName email')
            .populate('members.user', 'firstName lastName email userRole')
            .populate('teamRef')
            .populate('classes', 'name description')
            .sort({createdAt: -1});

        return res.json(projects);
    } catch (err) {
        console.error('Error in getProjectsForClass:', err);
        return res.status(500).json({error: err.message});
    }
};

exports.getAvailableProjects = async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'ADMIN') {
            return res.status(403).json({message: 'Only admins can view available projects'});
        }

        const projects = await Project.find({status: {$ne: 'COMPLETED'}})
            .select('name description')
            .populate({path: 'classes', select: 'name', options: {strictPopulate: false}})
            .lean();
        return res.json(projects);
    } catch (err) {
        console.error('Error in getAvailableProjects:', err);
        return res.status(500).json({error: err.message});
    }
};

exports.assignTeamToProject = async (req, res) => {
    try {
        const projectId = req.params.projectId;
        const {teamIds} = req.body;

        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            return res.status(400).json({message: `Invalid project ID: ${projectId}`});
        }

        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({message: 'Project not found'});
        }

        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({message: 'Only admins can assign teams'});
        }

        if (teamIds) {
            if (!Array.isArray(teamIds)) {
                return res.status(400).json({message: 'teamIds must be an array'});
            }
            const teams = await Team.find({_id: {$in: teamIds}});
            if (teams.length !== teamIds.length) {
                return res.status(400).json({message: 'One or more team IDs are invalid'});
            }
            project.teamRef = teamIds;
        } else {
            project.teamRef = [];
        }

        await project.save();

        const teamMembers = await Team.find({_id: {$in: project.teamRef}})
            .populate('members.user', 'firstName lastName email');
        const members = teamMembers.flatMap(team => team.members.map(member => ({
            user: member.user._id,
            role: 'STUDENT',
            dateJoined: new Date()
        })));

        project.members = project.members.filter(member => member.role !== 'STUDENT');
        project.members.push(...members);
        await project.save();

        await project.populate('teamRef', 'name');
        await project.populate('members.user', 'firstName lastName email');
        await project.populate('classes', 'name');
        res.status(200).json(project);
    } catch (error) {
        console.error('Error assigning teams:', error);
        res.status(500).json({message: 'Server error', error: error.message});
    }
};

module.exports = exports;