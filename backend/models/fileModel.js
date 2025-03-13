const mongoose = require('mongoose');
const { Schema } = mongoose;

const fileSchema = new Schema(
  {
    filename: { 
      type: String, 
      required: true 
    },
    originalName: { 
      type: String, 
      required: true 
    },
    path: { 
      type: String, 
      required: true 
    },
    mimetype: { 
      type: String, 
      required: true 
    },
    size: { 
      type: Number, 
      required: true 
    },
    description: { 
      type: String,
      default: ''
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    projectRef: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true
    },
    taskRef: {
      type: Schema.Types.ObjectId,
      ref: 'Task',
      default: null
    },
    isPublic: {
      type: Boolean,
      default: false
    },
    tags: [String]
  },
  { timestamps: true }
);

module.exports = mongoose.model('File', fileSchema); 