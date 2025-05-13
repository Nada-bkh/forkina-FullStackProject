// models/projectModelUpdate.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const updateProjectModel = () => {
    try {
        const Project = mongoose.model('Project');

        if (!Project.schema.paths.githubRepository) {
            Project.schema.add({
                githubRepository: {
                    type: String,
                    trim: true
                },
                repositoryDetails: {
                    type: Schema.Types.Mixed,
                    default: null
                }
            });

            console.log('Project model updated with GitHub repository fields');
        }

        return Project;
    } catch (error) {
        console.error('Error updating Project model:', error);
        throw error;
    }
};

module.exports = updateProjectModel;