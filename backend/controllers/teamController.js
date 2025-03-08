// controllers/teamController.js
const Team = require('../models/teamModel');

exports.createTeam = async (req, res) => {
  try {
    const team = new Team(req.body);
    await team.save();
    return res.status(201).json(team);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

exports.getAllTeams = async (req, res) => {
  try {
    const teams = await Team.find().populate('projectRef');
    return res.json(teams);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.getTeamById = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id).populate('projectRef');
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    return res.json(team);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.updateTeam = async (req, res) => {
  try {
    const team = await Team.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    return res.json(team);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

exports.deleteTeam = async (req, res) => {
  try {
    const team = await Team.findByIdAndDelete(req.params.id);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    return res.json({ message: 'Team deleted successfully' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
