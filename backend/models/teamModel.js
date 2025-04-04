// backend/models/teamModel.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

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
        classRef: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
        members: [
            {
                user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
                dateJoined: { type: Date, default: Date.now }
            }
        ],
        createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
    },
    { timestamps: true }
);

module.exports = mongoose.model('Team', teamSchema);