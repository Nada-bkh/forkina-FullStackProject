// routes/notificationRoutes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const notificationController = require('../controllers/notificationController');

router.use(authMiddleware);

router.get('/', notificationController.getUserNotifications);
router.put('/:id/read', notificationController.markNotificationAsRead);

module.exports = router;