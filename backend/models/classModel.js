// models/classModel.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const classSchema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String },
    department: { type: String },
/*
    tutor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true // The tutor assigned to this class
    },

 */
    students: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }],
      tutors: [{ // Changed tutor to tutors
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true
      }],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true // The admin who created the class
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Class', classSchema);