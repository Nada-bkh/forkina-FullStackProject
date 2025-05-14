// controllers/milestoneController.js
const Milestone = require('../models/milestoneModel');

exports.createMilestone = async (req, res) => {
  try {
    const milestone = new Milestone(req.body);
    await milestone.save();
    return res.status(201).json(milestone);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

exports.getAllMilestones = async (req, res) => {
  try {
    const milestones = await Milestone.find().populate('projectRef');
    return res.json(milestones);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.getMilestoneById = async (req, res) => {
  try {
    const milestone = await Milestone.findById(req.params.id).populate('projectRef');
    if (!milestone) {
      return res.status(404).json({ error: 'Milestone not found' });
    }
    return res.json(milestone);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.updateMilestone = async (req, res) => {
  try {
    const milestone = await Milestone.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!milestone) {
      return res.status(404).json({ error: 'Milestone not found' });
    }
    return res.json(milestone);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

exports.deleteMilestone = async (req, res) => {
  try {
    const milestone = await Milestone.findByIdAndDelete(req.params.id);
    if (!milestone) {
      return res.status(404).json({ error: 'Milestone not found' });
    }
    return res.json({ message: 'Milestone deleted successfully' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
