const mongoose = require('mongoose');
const { Schema } = mongoose;

const TaskStatus = {
  TODO: 'TODO',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED'
};

const TaskPriority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT'
};

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
    projectRef: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true
    },
    milestoneRef: {
      type: Schema.Types.ObjectId,
      ref: 'Milestone',
      default: null
    },
    tags: [{ type: String }],
    comments: [{
      author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      content: { type: String, required: true },
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now }
    }]
  },
  { timestamps: true }
);

taskSchema.post('save', async function() {
  if (this.projectRef) {
    const Project = mongoose.model('Project');
    const project = await Project.findById(this.projectRef);
    if (project) await project.updateProgress();
  }
});

module.exports = mongoose.model('Task', taskSchema)