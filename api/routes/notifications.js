import express from 'express';
import Notification from '../db/notificationModel.js';

const router = express.Router();

// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    next();
  } else {
    res.status(401).json({ message: 'Unauthorized' });
  }
}

// Get all notifications for the current user
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user._id;
    const limit = parseInt(req.query.limit) || 20;
    const skip = parseInt(req.query.skip) || 0;

    const notifications = await Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .exec();

    const totalCount = await Notification.countDocuments({ user: userId });
    const unreadCount = await Notification.getUnreadCount(userId);

    res.json({
      notifications,
      totalCount,
      unreadCount,
      hasMore: skip + notifications.length < totalCount
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get unread notification count
router.get('/unread-count', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user._id;
    const unreadCount = await Notification.getUnreadCount(userId);
    
    res.json({ unreadCount });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get recent notifications (for dropdown)
router.get('/recent', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user._id;
    const limit = parseInt(req.query.limit) || 5;
    
    const notifications = await Notification.getRecentNotifications(userId, limit);
    const unreadCount = await Notification.getUnreadCount(userId);
    
    res.json({
      notifications,
      unreadCount
    });
  } catch (error) {
    console.error('Error fetching recent notifications:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark a notification as read
router.put('/:id/read', isAuthenticated, async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.session.user._id;

    const notification = await Notification.findOne({
      _id: notificationId,
      user: userId
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    await notification.markAsRead();
    res.json({ message: 'Notification marked as read', notification });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark all notifications as read
router.put('/read-all', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user._id;

    await Notification.updateMany(
      { user: userId, read: false },
      { $set: { read: true, readAt: new Date() } }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a notification
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.session.user._id;

    const result = await Notification.deleteOne({
      _id: notificationId,
      user: userId
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;