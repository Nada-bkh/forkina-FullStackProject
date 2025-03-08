// models/evaluationModel.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const evaluationSchema = new Schema(
  {
    date:    { type: Date, default: Date.now },
    comment: { type: String },
    note:    { type: Number, default: 0 },
    userRef: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Evaluation', evaluationSchema);
