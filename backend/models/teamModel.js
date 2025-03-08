// models/teamModel.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const teamSchema = new Schema(
  {
    name: { type: String, required: true },
    creationDate: { type: Date, default: Date.now },
    score: { type: Number, default: 0 },
    // A team can be assigned to a project (or vice versa).
    // We'll keep a reference to project if needed:
    projectRef: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Team', teamSchema);
