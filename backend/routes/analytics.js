const router = require('express').Router();
const axios = require('axios');

router.get('/sonarqube/:projectKey', async (req, res) => {
    try {
        const response = await axios.get(
            `${process.env.SONARQUBE_URL}/api/measures/component`,
            {
                params: {
                    component: req.params.projectKey,
                    metricKeys: [
                        'bugs', 'vulnerabilities', 'code_smells',
                        'coverage', 'duplicated_lines_density',
                        'security_rating', 'reliability_rating',
                        'sqale_rating', 'alert_status'
                    ].join(',')
                },
                auth: {
                    username: process.env.SONARQUBE_TOKEN,
                    password: ''
                }
            }
        );
        res.json(response.data.component.measures);
    } catch (error) {
        res.status(500).json({
            error: 'Failed to fetch SonarQube metrics',
            details: error.message
        });
    }
});