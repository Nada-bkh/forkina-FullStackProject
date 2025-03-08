// models/taskModel.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const TaskStatus = {
  TODO: 'TODO',
  IN_PROGRESS: 'IN_PROGRESS',
  REVIEW: 'REVIEW',
  COMPLETED: 'COMPLETED'
};

const TaskPriority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT'
};

const commentSchema = new Schema({
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const taskSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    status: {
      type: String,
      enum: Object.values(TaskStatus),
      default: TaskStatus.TODO
    },
    priority: {
      type: String,
      enum: Object.values(TaskPriority),
      default: TaskPriority.MEDIUM
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    dueDate: { type: Date },
    startDate: { type: Date },
    completedDate: { type: Date },
    estimatedHours: { type: Number },
    actualHours: { type: Number },
    attachments: [{
      filename: String,
      originalName: String,
      path: String,
      mimetype: String,
      size: Number,
      uploadedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      },
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }],
    comments: [commentSchema],
    tags: [String],
    projectRef: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true
    },
    milestoneRef: {
      type: Schema.Types.ObjectId,
      ref: 'Milestone',
      default: null
    }
  },
  { timestamps: true }
);

// Hook to update project progress when task status changes
taskSchema.post('save', async function() {
  // If the task has a project reference
  if (this.projectRef) {
    const Project = mongoose.model('Project');
    const project = await Project.findById(this.projectRef);
    if (project) {
      await project.updateProgress();
    }
  }
});

module.exports = mongoose.model('Task', taskSchema);
