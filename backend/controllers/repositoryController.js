const updateProjectModel = require('../models/projectModelUpdate');
const Project = updateProjectModel();

/**
 * Link a GitHub repository to a project
 */
const linkRepository = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { repositoryUrl, repositoryDetails } = req.body;
        const userId = req.user._id;

        const project = await Project.findByIdAndUpdate(
            projectId,
            {
                $set: {
                    githubRepository: repositoryUrl,
                    repositoryDetails: repositoryDetails || {}
                }
            },
            { new: true } // Return the updated document
        ).lean();

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        return res.status(200).json({
            message: 'Repository linked successfully',
            project // Return the full updated project
        });
    } catch (error) {
        console.error('Error linking repository:', error);
        return res.status(500).json({ message: 'Failed to link repository', error: error.message });
    }
};
/**
 * Get repository details for a project
 */
const getRepositoryDetails = async (req, res) => {
    try {
        const { projectId } = req.params;
        const userId = req.user._id;

        if (!projectId) {
            return res.status(400).json({ message: 'Project ID is required' });
        }

        const project = await Project.findById(projectId)
            .populate({
                path: 'members.user',
                select: 'firstName lastName email profilePicture'
            })
            .lean();

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        const isMember = project.members && project.members.some(
            member => member && member.user &&
                member.user._id &&
                member.user._id.toString &&
                member.user._id.toString() === userId.toString()
        );

        if (!isMember) {
            return res.status(403).json({ message: 'You do not have access to this project' });
        }

        return res.status(200).json({
            _id: project._id,
            name: project.name,
            description: project.description,
            status: project.status,
            startDate: project.startDate,
            endDate: project.endDate,
            progressPercentage: project.progressPercentage,
            githubRepository: project.githubRepository,
            repositoryDetails: project.repositoryDetails || null,
            members: project.members
        });
    } catch (error) {
        console.error('Error fetching repository details:', error);
        return res.status(500).json({ message: 'Failed to fetch repository details', error: error.message });
    }
};

module.exports = {
    linkRepository,
    getRepositoryDetails
};