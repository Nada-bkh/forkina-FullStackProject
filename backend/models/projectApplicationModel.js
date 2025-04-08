const mongoose = require('mongoose');
const { Schema } = mongoose;

const projectApplicationSchema = new Schema(
  {
    teamName: { 
      type: String, 
      required: true 
    },
    student: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true
    },
    priority: {
      type: Number,
      required: true,
      min: 1,
      max: 2
    },
    motivationLetter: {
      type: String,
      required: true,
      maxlength: 1000 // Allow a bit more for validation on frontend
    },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'REJECTED'],
      default: 'PENDING'
    },
    submittedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

// Ensure student can only apply to a maximum of 2 projects
projectApplicationSchema.statics.countActiveApplications = async function(studentId) {
  return this.countDocuments({
    student: studentId,
    status: { $in: ['PENDING', 'ACCEPTED'] }
  });
};

module.exports = mongoose.model('ProjectApplication', projectApplicationSchema); 