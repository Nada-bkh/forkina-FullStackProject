const ProjectApplication = require('../models/projectApplicationModel');
const Project = require('../models/projectModel');
const mongoose = require('mongoose');

exports.getStudentApplications = async (req, res) => {
  try {
    const applications = await ProjectApplication.find({ studentRef: req.user.id })
        .populate('projectRef', 'name description tags')
        .sort({ priority: 1, submittedAt: -1 });

    return res.status(200).json(applications);
  } catch (err) {
    console.error('Error getting student applications:', err);
    return res.status(500).json({ error: err.message });
  }
};

exports.getTeamApplications = async (req, res) => {
  try {
    const { teamName } = req.params;

    const applications = await ProjectApplication.find({
      teamName: { $regex: new RegExp(`^${teamName.trim()}$`, 'i') }
    })
        .populate('projectRef', 'name description tags')
        .populate('studentRef', 'name email')
        .sort({ priority: 1 });

    return res.status(200).json({
      count: applications.length,
      submissions: applications
    });

  } catch (err) {
    console.error('Error getting team applications:', err);
    return res.status(500).json({ error: err.message });
  }
};

exports.submitApplication = async (req, res) => {
  try {
    const { teamName, projectId, priority, motivationLetter } = req.body;

    if (!teamName || !projectId || !priority || !motivationLetter) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const teamSubmissions = await ProjectApplication.find({
      teamName: { $regex: new RegExp(`^${teamName.trim()}$`, 'i') }
    })
        .populate('projectRef', 'name description tags')
        .populate('studentRef', 'name email');

    if (teamSubmissions.length > 0) {
      if (teamSubmissions.length >= 2) {
        return res.status(409).json({
          error: 'Your team has already submitted both project choices',
          existingSubmissions: teamSubmissions
        });
      }

      const originalSubmitter = teamSubmissions[0].studentRef._id;
      if (!originalSubmitter.equals(req.user.id)) {
        return res.status(403).json({
          error: 'Only the original submitter can complete team applications',
          existingSubmission: teamSubmissions[0]
        });
      }

      const existingProject = teamSubmissions.some(sub =>
          sub.projectRef._id.equals(projectId)
      );
      if (existingProject) {
        return res.status(409).json({
          error: 'Your team already applied to this project',
          existingSubmissions: teamSubmissions
        });
      }

      const existingPriority = teamSubmissions.some(sub =>
          sub.priority === Number(priority)
      );
      if (existingPriority) {
        return res.status(409).json({
          error: `Priority ${priority} already used by your team`,
          existingSubmissions: teamSubmissions
        });
      }
    }

    const existingStudentApplication = await ProjectApplication.findOne({
      studentRef: req.user.id,
      projectRef: projectId
    });

    if (existingStudentApplication) {
      return res.status(409).json({
        error: 'You already applied to this project',
        existingApplication: existingStudentApplication
      });
    }

    const project = await Project.findById(projectId);
    if (!project || project.approvalStatus !== 'APPROVED') {
      return res.status(400).json({ error: 'Project not available' });
    }

    const application = new ProjectApplication({
      teamName: teamName.trim(),
      studentRef: req.user.id,
      projectRef: projectId,
      priority: Number(priority),
      motivationLetter
    });

    await application.save();
    await application.populate('projectRef', 'name description tags');

    const updatedSubmissions = await ProjectApplication.find({
      teamName: { $regex: new RegExp(`^${teamName.trim()}$`, 'i') }
    }).populate('projectRef', 'name description tags');

    return res.status(201).json({
      message: `Application submitted (${updatedSubmissions.length}/2)`,
      teamSubmissions: updatedSubmissions
    });

  } catch (err) {
    console.error('Error submitting application:', err);
    return res.status(500).json({ error: err.message });
  }
};

exports.cancelApplication = async (req, res) => {
  try {
    const application = await ProjectApplication.findById(req.params.id);

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    if (application.studentRef.toString() !== req.user.id) {
      return res.status(403).json({ error: 'You are not authorized to cancel this application' });
    }

    if (application.status !== 'PENDING') {
      return res.status(400).json({ error: 'Only pending applications can be cancelled' });
    }

    await ProjectApplication.deleteOne({ _id: application._id });

    return res.status(200).json({ message: 'Application cancelled successfully' });
  } catch (err) {
    console.error('Error cancelling application:', err);
    return res.status(500).json({ error: err.message });
  }
};

exports.getTutorApplications = async (req, res) => {
  try {
    const applications = await ProjectApplication.find()
        .populate('projectRef', 'name description')
        .populate('studentRef', 'name email')
        .sort({ teamName: 1, priority: 1 });

    return res.status(200).json(applications);
  } catch (err) {
    console.error('Error getting tutor applications:', err);
    return res.status(500).json({ error: err.message });
  }
};
