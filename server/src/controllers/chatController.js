const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const Ride = require('../models/Ride');
const Booking = require('../models/Booking');
const Message = require('../models/Message');

/** Confirms the requester is either the driver or a confirmed passenger of the ride */
async function assertParticipant(rideId, userId) {
  const ride = await Ride.findById(rideId);
  if (!ride) throw ApiError.notFound('Ride not found');

  const isDriver = String(ride.driver) === String(userId);
  if (isDriver) return ride;

  const isPassenger = await Booking.exists({
    ride: rideId,
    passenger: userId,
    status: { $in: ['confirmed', 'completed'] },
  });
  if (!isPassenger) throw ApiError.forbidden('You are not a participant of this ride chat');
  return ride;
}

// @route GET /api/v1/chat/:rideId/messages
const getMessages = asyncHandler(async (req, res) => {
  await assertParticipant(req.params.rideId, req.user._id);

  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 50;

  const messages = await Message.find({ ride: req.params.rideId })
    .populate('sender', 'name avatar')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  return new ApiResponse(200, messages.reverse(), 'Messages fetched').send(res);
});

module.exports = { getMessages, assertParticipant };
