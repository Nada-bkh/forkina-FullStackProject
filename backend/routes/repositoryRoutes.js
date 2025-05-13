// routes/repositoryRoutes.js
const express = require('express');
const { linkRepository, getRepositoryDetails } = require('../controllers/repositoryController');
const updateProjectModel = require('../models/projectModelUpdate');

const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

// Apply authentication middleware
router.use(authMiddleware);
module.exports = router;