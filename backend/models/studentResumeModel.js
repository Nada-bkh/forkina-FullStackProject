// models/studentResumeModel.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const LevelEnum = {
  BEGINNER: 'BEGINNER',
  INTERMEDIATE: 'INTERMEDIATE',
  ADVANCED: 'ADVANCED'
};

const studentResumeSchema = new Schema(
  {
    skills:   [{ type: String }], // array of strings
    diplomas: [{ type: String }], // array of strings
    grade:    { type: String },
    level: {
      type: String,
      enum: Object.values(LevelEnum),
      default: LevelEnum.BEGINNER
    },
    // link to the user who owns this student resume
    userRef: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true // each user can have 1 student resume
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('StudentResume', studentResumeSchema);
