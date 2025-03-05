// routes/projectRoutes.js
const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const jwt = require('jsonwebtoken');

router.post('/', projectController.createProject);

// Middleware to verify if the user is a student
const verifyStudent = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(403).json({ message: 'No token provided' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== 'student') {
            return res.status(403).json({ message: 'Only students can add projects' });
        }
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Unauthorized: Invalid token' });
    }
};

// Create a new project
router.post('/', verifyStudent, async (req, res) => {
    const { githubLink, subject, level } = req.body;

    try {
        const newProject = new Project({
            githubLink,
            subject,
            level,
            studentId: req.user.userId,
        });

        await newProject.save();
        res.status(201).json({ message: 'Project added successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error adding project', error: err });
    }
});

module.exports = router;
module.exports = router;
