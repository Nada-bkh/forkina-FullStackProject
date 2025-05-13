// integration/repositoryIntegration.js
/**
 * This file provides functions to integrate repository features into the main app
 */

/**
 * Integrates repository routes into the Express app
 * @param {Object} app - Express application instance
 */
const integrateRepositoryRoutes = (app) => {
    // Import the repository routes
    const repositoryRoutes = require('../routes/repositoryRoutes');

    // Register the routes with the app under the assignments API prefix
    app.use('/api/assignments', repositoryRoutes);

    console.log('Repository routes integrated successfully');
};

/**
 * Updates the Project model with repository fields
 */
const updateProjectModel = () => {
    // Import and run the model update function
    const projectModelUpdate = require('../models/projectModelUpdate');
    projectModelUpdate();

    console.log('Project model updated with repository fields');
};

/**
 * Main integration function to set up all repository features
 * @param {Object} app - Express application instance
 */
const setupRepositoryFeatures = (app) => {
    try {
        // Update the Project model first
        updateProjectModel();

        // Then integrate the routes
        integrateRepositoryRoutes(app);

        console.log('Repository features set up successfully');
    } catch (error) {
        console.error('Error setting up repository features:', error);
        throw error;
    }
};

module.exports = {
    setupRepositoryFeatures,
    updateProjectModel,
    integrateRepositoryRoutes
};