import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['new_bid', 'bid_accepted', 'bid_rejected', 'counter_offer', 'order_placed', 'order_shipped', 'watch_sold'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  relatedEntity: {
    entityType: {
      type: String,
      enum: ['bid', 'order', 'watch'],
      required: true
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    }
  },
  read: {
    type: Boolean,
    default: false,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  readAt: {
    type: Date
  }
});

// Compound index for efficient queries
notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

// Method to mark as read
notificationSchema.methods.markAsRead = function() {
  this.read = true;
  this.readAt = new Date();
  return this.save();
};

// Static method to create a notification
notificationSchema.statics.createNotification = async function(data) {
  const notification = new this(data);
  await notification.save();
  return notification;
};

// Static method to get unread count for a user
notificationSchema.statics.getUnreadCount = async function(userId) {
  return this.countDocuments({ user: userId, read: false });
};

// Static method to get recent notifications for a user
notificationSchema.statics.getRecentNotifications = async function(userId, limit = 10) {
  return this.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .exec();
};

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;