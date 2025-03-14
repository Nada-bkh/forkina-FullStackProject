// models/projectModel.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const ProjectStatus = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  ARCHIVED: 'ARCHIVED'
};

const projectSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    creationDate: { type: Date, default: Date.now },
    startDate: { type: Date },
    endDate: { type: Date },
    status: {
      type: String,
      enum: Object.values(ProjectStatus),
      default: ProjectStatus.PENDING
    },
    tutorRef: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required:false
    },
    teamRef: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
      default: null
    },
    members: [{
      user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      role: {
        type: String,
        enum: ['TUTOR', 'STUDENT'],
        default: 'STUDENT'
      },
      dateJoined: {
        type: Date,
        default: Date.now
      }
    }],
    tags: [String],
    progressPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  { timestamps: true }
);

// Calculate progress based on completed tasks
projectSchema.methods.updateProgress = async function() {
  const Task = mongoose.model('Task');
  const totalTasks = await Task.countDocuments({ projectRef: this._id });
  
  if (totalTasks === 0) {
    this.progressPercentage = 0;
    return;
  }
  
  const completedTasks = await Task.countDocuments({ 
    projectRef: this._id, 
    status: 'COMPLETED' 
  });
  
  this.progressPercentage = Math.round((completedTasks / totalTasks) * 100);
  await this.save();
};

module.exports = mongoose.model('Project', projectSchema);