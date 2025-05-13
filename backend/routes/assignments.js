const mongoose = require('mongoose');
const express = require('express');
const { assignTeamsWithAI, submitFinalAssignment, getStudentProjects } = require('../controllers/assignmentController.js');
const Project = require('../models/projectModel');

const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();
router.use(authMiddleware);

router.post('/assign', assignTeamsWithAI);
router.post('/submit-final', submitFinalAssignment);

router.get('/team-projects', getStudentProjects);

router.get('/team-projects/:projectId/repository', async (req, res) => {
    try {
        const { projectId } = req.params;
        const userId = req.user._id;

        const project = await Project.findById(projectId)
            .select('+githubRepository +repositoryDetails')
            .populate({
                path: 'members.user',
                select: 'firstName lastName email profilePicture'
            })
            .lean();

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        const isPublicRepo = true;

        const isMember = project.members && Array.isArray(project.members) &&
            project.members.some(member =>
                member && member.user && member.user._id && userId &&
                member.user._id.toString() === userId.toString()
            );

        if (!isPublicRepo && !isMember) {
            return res.status(403).json({ message: 'You do not have access to this project' });
        }

        if (!project.githubRepository) {
            return res.status(404).json({
                message: 'No GitHub repository linked',
                code: 'REPO_NOT_LINKED'
            });
        }

        const responseData = {
            _id: project._id,
            name: project.name || 'Unnamed Project',
            description: project.description || '',
            status: project.status || 'NOT_STARTED',
            startDate: project.startDate,
            endDate: project.endDate,
            progressPercentage: project.progressPercentage || 0,
            githubRepository: project.githubRepository || '',
            repositoryDetails: project.repositoryDetails || null,
            members: project.members?.map(member => ({
                user: {
                    _id: member.user?._id,
                    firstName: member.user?.firstName || '',
                    lastName: member.user?.lastName || '',
                    email: member.user?.email || '',
                    profilePicture: member.user?.profilePicture || ''
                },
                role: member.role || 'member'
            })) || []
        };

        return res.status(200).json(responseData);

    } catch (error) {
        console.error('Error fetching repository details:', error);
        return res.status(500).json({
            message: 'Failed to fetch repository details',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

router.post('/team-projects/:projectId/repository', async (req, res) => {
    try {
        const { projectId } = req.params;
        const { repositoryUrl, repositoryDetails } = req.body;

        if (!projectId || !repositoryUrl) {
            return res.status(400).json({ message: 'Project ID and repository URL are required' });
        }

        const project = await Project.findById(projectId);

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        project.githubRepository = repositoryUrl;
        project.repositoryDetails = repositoryDetails || {};

        await project.save();

        return res.status(200).json({
            message: 'Repository linked successfully',
            project: {
                _id: project._id,
                name: project.name,
                githubRepository: project.githubRepository
            }
        });
    } catch (error) {
        console.error('Error linking repository:', error);
        return res.status(500).json({
            message: 'Failed to link repository',
            error: error.message
        });
    }
});

router.get('/team-projects/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;
        const userId = req.user._id;

        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            return res.status(400).json({
                message: 'Invalid project ID format',
                error: `Received invalid ID: ${projectId}`
            });
        }

        const project = await Project.findById(projectId)
            .populate({
                path: 'members.user',
                select: 'firstName lastName email'
            })
            .populate('tutorRef', 'firstName lastName email')
            .lean();

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        const isPublicRepo = true;

        const isMember = project.members && Array.isArray(project.members) &&
            project.members.some(member =>
                member?.user && member.user._id && userId &&
                member.user._id.toString() === userId.toString()
            );

        if (!isPublicRepo && !isMember) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const responseData = {
            ...project,
            githubRepository: project.githubRepository || '',
            repositoryDetails: project.repositoryDetails || null
        };

        res.status(200).json(responseData);
    } catch (error) {
        console.error('Error fetching project:', error);
        res.status(500).json({
            message: 'Server error',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

module.exports = router;