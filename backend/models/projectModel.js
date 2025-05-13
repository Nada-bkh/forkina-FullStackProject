// backend/models/projectModel.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const ProjectStatus = {
    PENDING: 'PENDING',
    ACCEPTED: 'ACCEPTED'
};

const ApprovalStatus = {
    RECOMMENDED: 'RECOMMENDED',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED'
};

const projectSchema = new Schema(
    {
        name: { type: String, required: true },
        description: { type: String, required: true },
        creationDate: { type: Date, default: Date.now },
        startDate: { type: Date },
        endDate: { type: Date },
        progressHistory: [{
            date: { type: Date, default: Date.now },
            progress: { type: Number, min: 0, max: 100 }
        }],
        status: {
            type: String,
            enum: Object.values(ProjectStatus),
            default: ProjectStatus.PENDING
        },
        approvalStatus: {
            type: String,
            enum: Object.values(ApprovalStatus),
            default: ApprovalStatus.APPROVED // Default for admin-created projects
        },
        tutorRef: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: false
        },
        githubRepository: {
            type: String,
            trim: true
        },
        repositoryDetails: {
            type: Schema.Types.Mixed,
            default: null
        },
        teamRef: [{ type: Schema.Types.ObjectId, ref: 'Team' }], // Already optional
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
        },
        classes: [{ type: Schema.Types.ObjectId, ref: 'Class' }], // Already optional
    },
    { timestamps: true }
);

const Project = mongoose.models.Project || mongoose.model('Project', projectSchema);

// Calculate progress based on completed tasks and update progress history
projectSchema.methods.updateProgress = async function() {
    const Task = mongoose.model('Task');
    const totalTasks = await Task.countDocuments({ projectRef: this._id });

    let newProgressPercentage;
    if (totalTasks === 0) {
        newProgressPercentage = 0;
    } else {
        const completedTasks = await Task.countDocuments({
            projectRef: this._id,
            status: 'COMPLETED'
        });
        newProgressPercentage = Math.round((completedTasks / totalTasks) * 100);
    }

    // Only update progressPercentage and history if the progress has changed
    if (this.progressPercentage !== newProgressPercentage) {
        this.progressPercentage = newProgressPercentage;

        // Append to progressHistory
        this.progressHistory.push({
            date: new Date(),
            progress: this.progressPercentage
        });
    }

    await this.save();
};

projectSchema.methods.updateMembersFromClasses = async function() {
    const Class = mongoose.model('Class');
    const User = mongoose.model('User');

    // Fetch all classes assigned to the project
    const classes = await Class.find({ _id: { $in: this.classes } });

    // Fetch all students in those classes
    const classIds = classes.map(cls => cls._id);
    const students = await User.find({
        classe: { $in: classIds },
        userRole: 'STUDENT'
    }).select('_id');

    // Add students to members if not already present
    const existingMemberIds = this.members.map(m => m.user.toString());
    const newMembers = students
        .filter(student => !existingMemberIds.includes(student._id.toString()))
        .map(student => ({
            user: student._id,
            role: 'STUDENT',
            dateJoined: new Date()
        }));

    this.members.push(...newMembers);
    await this.save();
};

module.exports = mongoose.model('Project', projectSchema);