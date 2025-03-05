// routes/subjectRoutes.js
const express = require('express');
const Subject = require('../models/Subject');
const router = express.Router();

// Middleware for role verification (ensure that only tutors can access this route)
const verifyTutor = (req, res, next) => {
    if (req.user.role !== 'tutor') {
        return res.status(403).json({ message: 'Only tutors can add subjects' });
    }
    next();
};

// Add a new subject (only for tutors)
router.post('/', verifyTutor, async (req, res) => {
    const { name, description, sections, level } = req.body;

    try {
        const newSubject = new Subject({ name, description, sections, level });
        await newSubject.save();
        res.status(201).json(newSubject);
    } catch (err) {
        res.status(500).json({ message: 'Error adding subject', error: err });
    }
});

// Get all subjects (for the dropdown in Add Project form)
router.get('/', async (req, res) => {
    try {
        const subjects = await Subject.find();
        res.status(200).json(subjects);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching subjects', error: err });
    }
});

module.exports = router;
