const mongoose = require('mongoose');
const { Schema } = mongoose;

const quizResultSchema = new Schema(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    repoUrl: {
      type: String,
      required: true
    },
    quizContent: {
      type: String,
      required: true
    },
    answers: [{
      questionIndex: Number,
      question: String,
      selectedAnswer: String,
      correctAnswer: String,
      isCorrect: Boolean
    }],
    score: {
      type: Number,
      min: 0,
      max: 100,
      required: true
    },
    totalQuestions: {
      type: Number,
      required: true
    },
    correctAnswers: {
      type: Number,
      required: true
    },
    completedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('QuizResult', quizResultSchema); 