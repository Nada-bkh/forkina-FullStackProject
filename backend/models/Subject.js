// models/Subject.js
const mongoose = require('mongoose');

const SubjectSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    sections: { type: [String], required: true }, // Twin, SIM, Arctic, etc.
    level: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], required: true },
});

const Subject = mongoose.model('Subject', SubjectSchema);
module.exports = Subject;
