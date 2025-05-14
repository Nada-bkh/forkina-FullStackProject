// models/tutorResumeModel.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const LevelEnum = {
  BEGINNER: 'BEGINNER',
  INTERMEDIATE: 'INTERMEDIATE',
  ADVANCED: 'ADVANCED'
};

const tutorResumeSchema = new Schema(
  {
    specialization: [{ type: String }], // array of strings
    experience:     [{ type: String }], // array of strings
    linkedInLink:   { type: String },
    level: {
      type: String,
      enum: Object.values(LevelEnum),
      default: LevelEnum.BEGINNER
    },
    score: { type: Number, default: 0 },
    // link to the user who owns this tutor resume
    userRef: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true // each user can have 1 tutor resume
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('TutorResume', tutorResumeSchema);
