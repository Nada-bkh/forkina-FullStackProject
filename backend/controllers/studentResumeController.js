// controllers/studentResumeController.js
const StudentResume = require('../models/studentResumeModel');

exports.createStudentResume = async (req, res) => {
  try {
    const studentResume = new StudentResume(req.body);
    await studentResume.save();
    return res.status(201).json(studentResume);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

exports.getAllStudentResumes = async (req, res) => {
  try {
    const resumes = await StudentResume.find().populate('userRef');
    return res.json(resumes);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.getStudentResumeById = async (req, res) => {
  try {
    const resume = await StudentResume.findById(req.params.id).populate('userRef');
    if (!resume) {
      return res.status(404).json({ error: 'Student resume not found' });
    }
    return res.json(resume);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.updateStudentResume = async (req, res) => {
  try {
    const resume = await StudentResume.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!resume) {
      return res.status(404).json({ error: 'Student resume not found' });
    }
    return res.json(resume);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

exports.deleteStudentResume = async (req, res) => {
  try {
    const resume = await StudentResume.findByIdAndDelete(req.params.id);
    if (!resume) {
      return res.status(404).json({ error: 'Student resume not found' });
    }
    return res.json({ message: 'Student resume deleted successfully' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
