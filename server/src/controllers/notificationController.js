const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const Notification = require('../models/Notification');

// @route GET /api/v1/notifications
const getMyNotifications = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;

  const [notifications, unreadCount, total] = await Promise.all([
    Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Notification.countDocuments({ user: req.user._id, isRead: false }),
    Notification.countDocuments({ user: req.user._id }),
  ]);

  return new ApiResponse(
    200,
    { notifications, unreadCount, page, totalPages: Math.ceil(total / limit) },
    'Notifications fetched'
  ).send(res);
});

// @route PATCH /api/v1/notifications/:id/read
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { isRead: true },
    { new: true }
  );
  if (!notification) throw ApiError.notFound('Notification not found');
  return new ApiResponse(200, notification, 'Marked as read').send(res);
});

// @route PATCH /api/v1/notifications/read-all
const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
  return new ApiResponse(200, null, 'All notifications marked as read').send(res);
});

module.exports = { getMyNotifications, markAsRead, markAllAsRead };
