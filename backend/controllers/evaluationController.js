// controllers/evaluationController.js
const Evaluation = require('../models/evaluationModel');
const Team = require('../models/teamModel');

// controllers/evaluationController.js
// Dans votre contrôleur d'évaluation
exports.createEvaluation = async (req, res) => {
  try {
    const { teamId } = req.params; // Récupéré de l'URL maintenant
    const { evaluator, evaluations, teamAverage } = req.body;
    
    // Validation de base
    if (!evaluator || !evaluations || !teamAverage) {
      return res.status(400).json({ 
        success: false, 
        error: "Missing required fields" 
      });
    }

    const evaluation = new Evaluation({
      team: teamId,
      evaluator,
      evaluations,
      teamAverage
    });

    await evaluation.save();
    await Team.findByIdAndUpdate(teamId, { evaluation: evaluation._id });
    res.status(201).json({ success: true, data: evaluation });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      error: error.message, 
      details: error.errors // Ajout des détails de validation Mongoose si disponibles
    });
  }
};
exports.getEvaluationByTeamId = async (req, res) => {
  try {
    const evaluation = await Evaluation.findOne({ team: req.params.teamId })
      .populate('evaluations.member')
      .populate('evaluator');
    if (!evaluation) {
      return res.json({ success: true, data: null });
    }
    res.json({ success: true, data: evaluation });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
// controllers/evaluationController.js
exports.getEvaluationById = async (req, res) => {
  try {
    const evaluation = await Evaluation.findById(req.params.id)
      .populate('team')
      .populate('evaluator')
      .populate('evaluations.member')
      .populate('tasks'); // Peuple les tâches
    
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
