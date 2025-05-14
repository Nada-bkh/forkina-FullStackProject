// routes/users.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware'); // Adjust path if needed
const User = require('../models/userModel'); // Point to your userModel.js

// Get all tutors (for admin use)
router.get('/tutors', authMiddleware, async (req, res) => {
    try {
        const tutors = await User.find({ userRole: 'TUTOR' }, 'firstName lastName _id');
        res.json(tutors);
    } catch (error) {
        console.error('Error fetching tutors:', error);
        res.status(500).json({ error: 'Failed to fetch tutors' });
    }
});

module.exports = router;