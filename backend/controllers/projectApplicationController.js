const ProjectApplication = require('../models/projectApplicationModel');
const Project = require('../models/projectModel');

// Get all applications for a student
exports.getStudentApplications = async (req, res) => {
  try {
    const applications = await ProjectApplication.find({ student: req.user.id })
      .populate('project', 'name description tags')
      .sort({ priority: 1, submittedAt: -1 });
    
    return res.status(200).json(applications);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Submit a new application
exports.submitApplication = async (req, res) => {
  try {
    const { teamName, projectId, priority, motivationLetter } = req.body;

    // Validation
    if (!teamName || !projectId || !priority || !motivationLetter) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Validate word count
    const wordCount = motivationLetter.trim().split(/\s+/).length;
    if (wordCount > 250) {
      return res.status(400).json({ error: 'Motivation letter exceeds 250 words limit' });
    }

    // Check if project exists and is approved
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    if (project.status !== 'APPROVED') {
      return res.status(400).json({ error: 'You can only apply to approved projects' });
    }

    // Check if student already applied to this project
    const existingApplication = await ProjectApplication.findOne({ 
      student: req.user.id,
      project: projectId
    });

    if (existingApplication) {
      return res.status(400).json({ error: 'You have already applied to this project' });
    }

    // Check application limit
    const applicationCount = await ProjectApplication.countActiveApplications(req.user.id);
    if (applicationCount >= 2) {
      return res.status(400).json({ error: 'You can only apply to a maximum of 2 projects' });
    }

    // Create new application
    const application = new ProjectApplication({
      teamName,
      student: req.user.id,
      project: projectId,
      priority,
      motivationLetter
    });

    await application.save();

    // Populate for response
    await application.populate('project', 'name description tags');

    return res.status(201).json(application);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Cancel an application
exports.cancelApplication = async (req, res) => {
  try {
    const application = await ProjectApplication.findById(req.params.id);
    
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    // Ensure the student owns this application
    if (application.student.toString() !== req.user.id) {
      return res.status(403).json({ error: 'You are not authorized to cancel this application' });
    }
    
    // Ensure the application is still pending
    if (application.status !== 'PENDING') {
      return res.status(400).json({ error: 'Only pending applications can be cancelled' });
    }
    
    // Delete the application
    await ProjectApplication.deleteOne({ _id: application._id });
    
    return res.status(200).json({ message: 'Application cancelled successfully' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}; 