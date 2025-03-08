// controllers/evaluationController.js
const Evaluation = require('../models/evaluationModel');

exports.createEvaluation = async (req, res) => {
  try {
    const evaluation = new Evaluation(req.body);
    await evaluation.save();
    return res.status(201).json(evaluation);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

exports.getAllEvaluations = async (req, res) => {
  try {
    const evaluations = await Evaluation.find().populate('userRef');
    return res.json(evaluations);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.getEvaluationById = async (req, res) => {
  try {
    const evaluation = await Evaluation.findById(req.params.id).populate('userRef');
    if (!evaluation) {
      return res.status(404).json({ error: 'Evaluation not found' });
    }
    return res.json(evaluation);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.updateEvaluation = async (req, res) => {
  try {
    const evaluation = await Evaluation.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!evaluation) {
      return res.status(404).json({ error: 'Evaluation not found' });
    }
    return res.json(evaluation);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

exports.deleteEvaluation = async (req, res) => {
  try {
    const evaluation = await Evaluation.findByIdAndDelete(req.params.id);
    if (!evaluation) {
      return res.status(404).json({ error: 'Evaluation not found' });
    }
    return res.json({ message: 'Evaluation deleted successfully' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
