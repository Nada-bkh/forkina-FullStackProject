// backend/models/teamModel.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const teamSchema = new Schema(
    {
        name: { type: String, required: true },
        creationDate: { type: Date, default: Date.now },
        evaluation: { type: mongoose.Schema.Types.ObjectId, ref: 'Evaluation' , default: null },
        score: { type: Number, default: 0 },
        projectRef: {
            type: Schema.Types.ObjectId,
            ref: 'Project'
        },
        classRef: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
        members: [
            {
                user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
                dateJoined: { type: Date, default: Date.now }
            }
        ],
        tutor: { type: Schema.Types.ObjectId, ref: 'User', default: null },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
    },

    { timestamps: true }
);
teamSchema.methods.ensurePopulated = async function() {
    if (typeof this.classRef === 'string' || this.classRef instanceof mongoose.Types.ObjectId) {
      this.classRef = await mongoose.model('Class').findById(this.classRef).select('name').lean();
    }
    return this;
  };
module.exports = mongoose.model('Team', teamSchema);