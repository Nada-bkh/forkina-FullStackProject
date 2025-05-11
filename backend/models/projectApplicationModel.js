const mongoose = require('mongoose');
const { Schema } = mongoose;

const projectApplicationSchema = new Schema(
    {
        teamName: {
            type: String,
            required: true
        },
        studentRef: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        projectRef: {
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
            maxlength: 250
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

projectApplicationSchema.index({ projectRef: 1, studentRef: 1 }, { unique: true });

projectApplicationSchema.statics.countActiveApplications = async function(studentId) {
    return this.countDocuments({
        studentRef: studentId,
        status: { $in: ['PENDING', 'ACCEPTED'] }
    });
};

module.exports = mongoose.model('ProjectApplication', projectApplicationSchema);
