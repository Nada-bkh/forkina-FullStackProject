// models/milestoneModel.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const milestoneSchema = new Schema(
  {
    name:    { type: String, required: true },
    dueDate: { type: Date },
    isDone:  { type: Boolean, default: false },
    // belongs to a project
    projectRef: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Milestone', milestoneSchema);
