// controllers/notificationController.js
const Notification = require('../models/notificationModel');

exports.getUserNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id })
        .sort({ createdAt: -1 });
    return res.json(notifications);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.markNotificationAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
        { _id: req.params.id, user: req.user.id },
        { read: true },
        { new: true }
    );
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    return res.json(notification);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};