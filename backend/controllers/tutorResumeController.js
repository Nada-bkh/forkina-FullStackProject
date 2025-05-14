// controllers/tutorResumeController.js
const TutorResume = require('../models/tutorResumeModel');

exports.createTutorResume = async (req, res) => {
  try {
    const tutorResume = new TutorResume(req.body);
    await tutorResume.save();
    return res.status(201).json(tutorResume);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

exports.getAllTutorResumes = async (req, res) => {
  try {
    const resumes = await TutorResume.find().populate('userRef');
    return res.json(resumes);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.getTutorResumeById = async (req, res) => {
  try {
    const resume = await TutorResume.findById(req.params.id).populate('userRef');
    if (!resume) {
      return res.status(404).json({ error: 'Tutor resume not found' });
    }
    return res.json(resume);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.updateTutorResume = async (req, res) => {
  try {
    const resume = await TutorResume.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!resume) {
      return res.status(404).json({ error: 'Tutor resume not found' });
    }
    return res.json(resume);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

exports.deleteTutorResume = async (req, res) => {
  try {
    const resume = await TutorResume.findByIdAndDelete(req.params.id);
    if (!resume) {
      return res.status(404).json({ error: 'Tutor resume not found' });
    }
    return res.json({ message: 'Tutor resume deleted successfully' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
