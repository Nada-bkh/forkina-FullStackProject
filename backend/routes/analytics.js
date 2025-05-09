const axios = require('axios');
const express = require('express');
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();
router.use(authMiddleware);

router.get('/sonarqube/projects', async (req, res) => {
    try {
        const response = await axios.get(`${process.env.SONARQUBE_URL}/api/projects/search`, {
            auth: {
                username: process.env.SONARQUBE_USERNAME,
                password: process.env.SONARQUBE_PASSWORD,
            },
        });

        if (!response.data || !response.data.components) {
            return res.status(404).json({ error: 'No projects found' });
        }

        res.json(response.data.components);
    } catch (error) {
        console.error('SonarQube projects fetch error:', error?.response?.data || error.message);
        res.status(500).json({
            error: 'Failed to fetch SonarQube projects',
            details: error?.response?.data || error.message,
        });
    }
});

module.exports = router;
