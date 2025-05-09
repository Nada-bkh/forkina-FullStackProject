const express = require('express');
const router = express.Router();
const projectRequestController = require('../controllers/projectRequestController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/', authMiddleware, projectRequestController.createProjectRequest);
router.get('/pending', authMiddleware, projectRequestController.getPendingProjectRequests);
router.put('/:requestId/confirm', authMiddleware, projectRequestController.confirmProjectRequest);
router.put('/:requestId/reject', authMiddleware, projectRequestController.rejectProjectRequest);

module.exports = router;