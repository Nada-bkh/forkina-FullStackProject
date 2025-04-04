const ProjectRequest = require('../models/projectRequestModel');
const Project = require('../models/projectModel');
const Team = require('../models/teamModel');
const User = require('../models/userModel');
const Notification = require('../models/notificationModel');
const { Types } = require('mongoose');

// Create a new project request
exports.createProjectRequest = async (req, res) => {
    try {
        const { projectName, description, proposedTeam } = req.body;

        // Validate input
        if (!projectName || !description || !proposedTeam || !Array.isArray(proposedTeam)) {
            return res.status(400).json({ error: 'Project name, description, and proposed team are required.' });
        }

        // Validate that all proposed team members exist
        const validTeamMembers = [];
        for (const userId of proposedTeam) {
            const user = await User.findById(userId);
            if (!user) {
                return res.status(400).json({ error: `Invalid user ID in proposed team: ${userId}` });
            }
            validTeamMembers.push(userId);
        }

        // Create the project request
        const projectRequest = new ProjectRequest({
            projectName,
            description,
            student: req.user.id,
            class: req.user.classe,
            proposedTeam: validTeamMembers,
            status: 'PENDING',
        });
        await projectRequest.save();

        // Create a notification for the student who made the request
        const studentNotification = new Notification({
            user: req.user.id,
            message: `You have submitted a project request: ${projectName}`,
        });
        await studentNotification.save();

        // Create notifications for the proposed team members
        for (const teamMemberId of validTeamMembers) {
            const teamNotification = new Notification({
                user: teamMemberId,
                message: `You have been added to a proposed team for project: ${projectName}`,
            });
            await teamNotification.save();
        }

        return res.status(201).json(projectRequest);
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
};
// Fetch all pending project requests (for admin)
exports.getPendingProjectRequests = async (req, res) => {
    try {
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Only admins can view project requests' });
        }

        const requests = await ProjectRequest.find({ status: 'PENDING' })
            .populate('student', 'firstName lastName email')
            .populate('proposedTeam.student', 'firstName lastName email')
            .populate('class', 'name');

        res.json(requests);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Confirm a project request
exports.confirmProjectRequest = async (req, res) => {
    try {
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Only admins can confirm project requests' });
        }

        const { requestId } = req.params;

        const projectRequest = await ProjectRequest.findById(requestId)
            .populate('student')
            .populate('proposedTeam.student')
            .populate('class');

        if (!projectRequest) {
            return res.status(404).json({ error: 'Project request not found' });
        }

        if (projectRequest.status !== 'PENDING') {
            return res.status(400).json({ error: 'Request is not pending' });
        }

        // Create a team
        const team = new Team({
            name: `${projectRequest.projectName} Team`,
            members: [
                { user: projectRequest.student._id, role: 'LEADER' },
                ...projectRequest.proposedTeam.map(member => ({
                    user: member.student._id,
                    role: 'MEMBER',
                })),
            ],
            class: projectRequest.class._id,
        });

        await team.save();

        // Create the project
        const project = new Project({
            name: projectRequest.projectName,
            description: projectRequest.description,
            status: 'PENDING',
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            classes: [projectRequest.class._id],
            teamRef: team._id,
            members: [
                { user: projectRequest.student._id, role: 'LEADER' },
                ...projectRequest.proposedTeam.map(member => ({
                    user: member.student._id,
                    role: 'MEMBER',
                })),
            ],
        });

        await project.save();

        // Update the request status
        projectRequest.status = 'APPROVED';
        await projectRequest.save();

        // Notify all team members
        const teamMembers = [projectRequest.student, ...projectRequest.proposedTeam.map(m => m.student)];
        const notifications = teamMembers.map(member => ({
            recipient: member._id,
            message: `Your project request for "${projectRequest.projectName}" has been approved! The project and team have been created.`,
            type: 'PROJECT_APPROVED',
            relatedId: project._id,
        }));

        await Notification.insertMany(notifications);

        res.json({ projectRequest, project, team });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Reject a project request
exports.rejectProjectRequest = async (req, res) => {
    try {
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Only admins can reject project requests' });
        }

        const { requestId } = req.params;

        const projectRequest = await ProjectRequest.findById(requestId)
            .populate('student')
            .populate('proposedTeam.student');

        if (!projectRequest) {
            return res.status(404).json({ error: 'Project request not found' });
        }

        if (projectRequest.status !== 'PENDING') {
            return res.status(400).json({ error: 'Request is not pending' });
        }

        projectRequest.status = 'REJECTED';
        await projectRequest.save();

        // Notify all team members
        const teamMembers = [projectRequest.student, ...projectRequest.proposedTeam.map(m => m.student)];
        const notifications = teamMembers.map(member => ({
            recipient: member._id,
            message: `Your project request for "${projectRequest.projectName}" has been rejected by the admin.`,
            type: 'PROJECT_REJECTED',
            relatedId: projectRequest._id,
        }));

        await Notification.insertMany(notifications);

        res.json(projectRequest);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};