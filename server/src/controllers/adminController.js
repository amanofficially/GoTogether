const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const User = require('../models/User');
const Ride = require('../models/Ride');
const Booking = require('../models/Booking');

// @route GET /api/v1/admin/dashboard
const getDashboardStats = asyncHandler(async (req, res) => {
  const [totalUsers, totalDrivers, totalRides, activeRides, totalBookings, completedRides] =
    await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isDriver: true }),
      Ride.countDocuments(),
      Ride.countDocuments({ status: { $in: ['scheduled', 'ongoing'] } }),
      Booking.countDocuments(),
      Ride.countDocuments({ status: 'completed' }),
    ]);

  return new ApiResponse(
    200,
    { totalUsers, totalDrivers, totalRides, activeRides, totalBookings, completedRides },
    'Dashboard stats fetched'
  ).send(res);
});

// @route GET /api/v1/admin/users
const listUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const filter = {};
  if (req.query.search) {
    filter.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { email: { $regex: req.query.search, $options: 'i' } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 }),
    User.countDocuments(filter),
  ]);

  return new ApiResponse(
    200,
    { users, page, totalPages: Math.ceil(total / limit), total },
    'Users fetched'
  ).send(res);
});

// @route PATCH /api/v1/admin/users/:id/ban
const banUser = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { isBanned: true, banReason: reason || 'Violation of platform policy', refreshToken: undefined },
    { new: true }
  );
  if (!user) throw ApiError.notFound('User not found');
  return new ApiResponse(200, user.toSafeObject(), 'User banned').send(res);
});

// @route PATCH /api/v1/admin/users/:id/unban
const unbanUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { isBanned: false, banReason: '' },
    { new: true }
  );
  if (!user) throw ApiError.notFound('User not found');
  return new ApiResponse(200, user.toSafeObject(), 'User unbanned').send(res);
});

// @route GET /api/v1/admin/rides
const listRides = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const filter = {};
  if (req.query.status) filter.status = req.query.status;

  const [rides, total] = await Promise.all([
    Ride.find(filter)
      .populate('driver', 'name email')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 }),
    Ride.countDocuments(filter),
  ]);

  return new ApiResponse(
    200,
    { rides, page, totalPages: Math.ceil(total / limit), total },
    'Rides fetched'
  ).send(res);
});

module.exports = { getDashboardStats, listUsers, banUser, unbanUser, listRides };
