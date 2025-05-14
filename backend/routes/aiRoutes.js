const express = require('express');
const router = express.Router();
const { recommendAdvancedFeatures } = require('../controllers/aiController');

router.post('/recommend-advanced-features', recommendAdvancedFeatures);

module.exports = router;
