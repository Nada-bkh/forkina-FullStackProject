// controllers/notificationController.js
const Notification = require('../models/notificationModel');

exports.getUserNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query; // Add pagination
    const notifications = await Notification.find({ user: req.user.id })
        .populate('user', 'firstName lastName') // Populate user details
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));
    const total = await Notification.countDocuments({ user: req.user.id });
    return res.json({
      notifications,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

exports.markNotificationAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
        { _id: req.params.id, user: req.user.id },
        { read: true },
        { new: true }
    ).populate('user', 'firstName lastName');
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found or you do not have permission to update it' });
    }
    return res.json(notification);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to mark notification as read' });
  }
};