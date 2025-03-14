// models/teamModel.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const teamSchema = new Schema(
  {
    name: { type: String, required: true },
    creationDate: { type: Date, default: Date.now },
    score: { type: Number, default: 0 },
    projectRef: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      default: null
    },
    classRef: {  // Add reference to the class
      type: Schema.Types.ObjectId,
      ref: 'Class',
      required: true
    },
    members: [{  // Add members array
      user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      dateJoined: {
        type: Date,
        default: Date.now
      }
    }],
    createdBy: {  // Add creator reference
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Team', teamSchema);