const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const Rating = require('../models/Rating');
const Ride = require('../models/Ride');
const Booking = require('../models/Booking');
const User = require('../models/User');

// @route POST /api/v1/ratings
const createRating = asyncHandler(async (req, res) => {
  const { rideId, toUserId, rating, review } = req.body;

  const ride = await Ride.findById(rideId);
  if (!ride) throw ApiError.notFound('Ride not found');
  if (ride.status !== 'completed') {
    throw ApiError.badRequest('You can only rate participants after the ride is completed');
  }

  // Verify the rater actually participated in this ride (driver or confirmed passenger)
  const isDriver = String(ride.driver) === String(req.user._id);
  const wasPassenger = await Booking.exists({
    ride: rideId,
    passenger: req.user._id,
    status: { $in: ['confirmed', 'completed'] },
  });
  if (!isDriver && !wasPassenger) {
    throw ApiError.forbidden('You did not participate in this ride');
  }
  if (String(toUserId) === String(req.user._id)) {
    throw ApiError.badRequest('You cannot rate yourself');
  }

  const existing = await Rating.findOne({ ride: rideId, from: req.user._id, to: toUserId });
  if (existing) throw ApiError.conflict('You have already rated this user for this ride');

  const newRating = await Rating.create({
    ride: rideId,
    from: req.user._id,
    to: toUserId,
    rating,
    review,
  });

  // Recalculate running average rating for the rated user
  const stats = await Rating.aggregate([
    { $match: { to: newRating.to } },
    { $group: { _id: '$to', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  if (stats.length > 0) {
    await User.findByIdAndUpdate(toUserId, {
      ratingAverage: Math.round(stats[0].avg * 10) / 10,
      ratingCount: stats[0].count,
    });
  }

  return new ApiResponse(201, newRating, 'Rating submitted successfully').send(res);
});

// @route GET /api/v1/ratings/user/:userId
const getUserRatings = asyncHandler(async (req, res) => {
  const ratings = await Rating.find({ to: req.params.userId })
    .populate('from', 'name avatar')
    .sort({ createdAt: -1 })
    .limit(50);
  return new ApiResponse(200, ratings, 'Ratings fetched').send(res);
});

// @route GET /api/v1/ratings/mine
// Every rating the logged-in user has *given*, used by the client to know
// which completed rides/participants they've already reviewed so the
// "Rate & review" form doesn't show up twice for the same ride.
const getMyRatings = asyncHandler(async (req, res) => {
  const ratings = await Rating.find({ from: req.user._id }).select('ride to rating review createdAt');
  return new ApiResponse(200, ratings, 'Your ratings fetched').send(res);
});

module.exports = { createRating, getUserRatings, getMyRatings };
