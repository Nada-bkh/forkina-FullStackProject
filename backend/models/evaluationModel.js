// evaluation.model.js
const mongoose = require('mongoose');

const evaluationSchema = new mongoose.Schema({
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  evaluator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  evaluations: [{
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    clarity: { type: Number, min: 1, max: 5 },
    commitFrequency: { type: Number, min: 1, max: 5 },
    deadlineRespect: { type: Number, min: 1, max: 5 },
    efficiency: { type: Number, min: 1, max: 5 },
    codePerformance: { type: Number, min: 1, max: 5 },
    plagiarismDetection: { type: Number, min: 0, max: 1 },
    collaboration: { type: Number, min: 1, max: 5 },
    testsValidation: { type: Number, min: 1, max: 5 },
    reportQuality: { type: Number, min: 1, max: 5 },
    quiz: { type: Number, min: 0, max: 5 },
    note: { type: Number, min: 0, max: 20 }
  }],
  quizInfo: {
    repoUrl: { type: String },
    score: { type: Number },
    totalQuestions: { type: Number },
    completedAt: { type: Date }
  },
  teamAverage: { type: Number, min: 0, max: 20 },
  evaluatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Evaluation', evaluationSchema);