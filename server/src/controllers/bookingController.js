const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const Ride = require('../models/Ride');
const Booking = require('../models/Booking');
const Notification = require('../models/Notification');

/**
 * IMPORTANT — why this file does not use mongoose sessions/transactions:
 *
 * Multi-document transactions (`mongoose.startSession()` + `withTransaction`)
 * only work against a MongoDB **replica set** or a **mongos** router. A plain
 * local `mongod` (the default `mongodb://127.0.0.1:27017/...` most people run
 * for development) is a standalone server, and every transactional write on
 * it fails with:
 *
 *   MongoServerError: Transaction numbers are only allowed on a
 *   replica set member or mongos
 *
 * That was the exact 500 error breaking "Book Ride" for every user (see
 * server/logs/error.log). Instead of requiring a replica set, every write
 * below uses **atomic, conditional, single-document operations**
 * (`findOneAndUpdate` with a filter that re-checks the invariant it depends
 * on). That is enough to make seat inventory race-safe — two passengers
 * booking the last seat at the same instant can never both succeed — while
 * working identically on a standalone mongod, a replica set, or Atlas.
 */

/** Rolls back a seat reservation made on the ride during this request. */
async function releaseSeats(rideId, seats) {
  if (!seats) return;
  await Ride.findByIdAndUpdate(rideId, { $inc: { availableSeats: seats } });
}

async function notify(io, { user, title, message, type, relatedId }) {
  const notification = await Notification.create({ user, title, message, type, relatedId });
  // Advanced feature: push the notification over the socket instantly, so a
  // connected client updates its bell icon / toast without waiting on the
  // notifications polling interval.
  io?.to(`user:${user}`).emit('notification:new', notification);
  return notification;
}

// @route POST /api/v1/bookings
const createBooking = asyncHandler(async (req, res) => {
  const { rideId, seatsBooked, pickupPoint } = req.body;
  const io = req.app.get('io');

  const ride = await Ride.findById(rideId);
  if (!ride) throw ApiError.notFound('Ride not found');
  if (ride.status !== 'scheduled') throw ApiError.badRequest('This ride is no longer available');
  if (String(ride.driver) === String(req.user._id)) {
    throw ApiError.badRequest('You cannot book your own ride');
  }
  if (ride.departureTime.getTime() <= Date.now()) {
    throw ApiError.badRequest('This ride has already departed');
  }

  const existing = await Booking.findOne({ ride: rideId, passenger: req.user._id });
  if (existing && !['cancelled', 'rejected'].includes(existing.status)) {
    throw ApiError.conflict('You have already booked this ride');
  }
  if (ride.availableSeats < seatsBooked) {
    throw ApiError.badRequest(`Only ${ride.availableSeats} seat(s) available`);
  }

  const fare = ride.pricePerSeat * seatsBooked;
  const instantBooking = ride.preferences?.instantBooking !== false;
  const status = instantBooking ? 'confirmed' : 'pending';

  // Atomically reserve seats only if they are still available at the moment
  // of write. If another request already took them, this matches nothing
  // and we bail out with a clean 400 instead of overselling the ride.
  if (status === 'confirmed') {
    const reserved = await Ride.findOneAndUpdate(
      { _id: rideId, status: 'scheduled', availableSeats: { $gte: seatsBooked } },
      { $inc: { availableSeats: -seatsBooked } },
      { new: true }
    );
    if (!reserved) {
      throw ApiError.badRequest('Seats were just taken by another passenger. Please try again.');
    }
  }

  let booking;
  try {
    // Reuse a previously cancelled/rejected booking document instead of
    // inserting a new one — the schema has a unique index on
    // (ride, passenger), so a fresh insert would violate it.
    if (existing) {
      existing.seatsBooked = seatsBooked;
      existing.fare = fare;
      existing.status = status;
      existing.pickupPoint = pickupPoint;
      existing.cancellationReason = '';
      booking = await existing.save();
    } else {
      booking = await Booking.create({
        ride: rideId,
        passenger: req.user._id,
        seatsBooked,
        fare,
        status,
        pickupPoint,
      });
    }
  } catch (err) {
    // Roll back the seat reservation if persisting the booking failed for
    // any reason (e.g. a concurrent duplicate request hit the unique index).
    await releaseSeats(rideId, status === 'confirmed' ? seatsBooked : 0);
    if (err.code === 11000) throw ApiError.conflict('You have already booked this ride');
    throw err;
  }

  await notify(io, {
    user: ride.driver,
    title: status === 'confirmed' ? 'New Booking Confirmed' : 'New Booking Request',
    message: `A passenger booked ${seatsBooked} seat(s) on your ride departing ${ride.departureTime.toDateString()}.`,
    type: 'booking',
    relatedId: booking._id,
  });

  return new ApiResponse(201, booking, 'Booking created successfully').send(res);
});

// @route GET /api/v1/bookings/me
const getMyBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ passenger: req.user._id })
    .populate({
      path: 'ride',
      populate: [{ path: 'driver', select: 'name avatar ratingAverage' }, { path: 'vehicle' }],
    })
    .sort({ createdAt: -1 });
  return new ApiResponse(200, bookings, 'Bookings fetched').send(res);
});

// @route GET /api/v1/bookings/ride/:rideId  (driver view of requests on their ride)
const getBookingsForRide = asyncHandler(async (req, res) => {
  const ride = await Ride.findOne({ _id: req.params.rideId, driver: req.user._id });
  if (!ride) throw ApiError.notFound('Ride not found or you are not the driver');

  const bookings = await Booking.find({ ride: ride._id }).populate(
    'passenger',
    'name avatar phone ratingAverage'
  );
  return new ApiResponse(200, bookings, 'Ride bookings fetched').send(res);
});

// @route PATCH /api/v1/bookings/:id/respond  (driver approves/rejects a pending request)
const respondToBooking = asyncHandler(async (req, res) => {
  const { action } = req.body; // 'approve' | 'reject'
  if (!['approve', 'reject'].includes(action)) {
    throw ApiError.badRequest("action must be 'approve' or 'reject'");
  }
  const io = req.app.get('io');

  const booking = await Booking.findById(req.params.id);
  if (!booking) throw ApiError.notFound('Booking not found');
  if (booking.status !== 'pending') throw ApiError.badRequest('Booking already processed');

  const ride = await Ride.findById(booking.ride);
  if (!ride || String(ride.driver) !== String(req.user._id)) {
    throw ApiError.forbidden('You are not authorized to respond to this booking');
  }

  let updatedBooking;

  if (action === 'approve') {
    const reserved = await Ride.findOneAndUpdate(
      { _id: ride._id, availableSeats: { $gte: booking.seatsBooked } },
      { $inc: { availableSeats: -booking.seatsBooked } },
      { new: true }
    );
    if (!reserved) {
      throw ApiError.badRequest('Not enough seats remaining to approve this booking');
    }

    // Guard against two near-simultaneous responses to the same pending
    // booking (e.g. double click) by only flipping status if it is still
    // 'pending' at write time.
    updatedBooking = await Booking.findOneAndUpdate(
      { _id: booking._id, status: 'pending' },
      { status: 'confirmed' },
      { new: true }
    );
    if (!updatedBooking) {
      await releaseSeats(ride._id, booking.seatsBooked);
      throw ApiError.badRequest('Booking already processed');
    }
  } else {
    updatedBooking = await Booking.findOneAndUpdate(
      { _id: booking._id, status: 'pending' },
      { status: 'rejected' },
      { new: true }
    );
    if (!updatedBooking) throw ApiError.badRequest('Booking already processed');
  }

  await notify(io, {
    user: booking.passenger,
    title: action === 'approve' ? 'Booking Confirmed' : 'Booking Rejected',
    message:
      action === 'approve'
        ? 'Your ride booking has been confirmed by the driver.'
        : 'Your ride booking request was declined by the driver.',
    type: 'booking',
    relatedId: booking._id,
  });

  return new ApiResponse(200, updatedBooking, `Booking ${action}d successfully`).send(res);
});

// @route PATCH /api/v1/bookings/:id/cancel
const cancelBooking = asyncHandler(async (req, res) => {
  const io = req.app.get('io');
  const booking = await Booking.findOne({ _id: req.params.id, passenger: req.user._id });
  if (!booking) throw ApiError.notFound('Booking not found');
  if (!['pending', 'confirmed'].includes(booking.status)) {
    throw ApiError.badRequest('This booking cannot be cancelled');
  }

  const wasConfirmed = booking.status === 'confirmed';

  // Only cancel if the status hasn't changed since we read it (protects
  // against a driver approving the same instant the passenger cancels).
  const updatedBooking = await Booking.findOneAndUpdate(
    { _id: booking._id, status: booking.status },
    {
      status: 'cancelled',
      cancellationReason: req.body.reason || 'Cancelled by passenger',
    },
    { new: true }
  );
  if (!updatedBooking) throw ApiError.badRequest('This booking cannot be cancelled');

  if (wasConfirmed) {
    await releaseSeats(booking.ride, booking.seatsBooked);
  }

  const ride = await Ride.findById(booking.ride).select('driver departureTime');
  if (ride) {
    await notify(io, {
      user: ride.driver,
      title: 'Booking Cancelled',
      message: `A passenger cancelled their booking on your ride departing ${ride.departureTime.toDateString()}.`,
      type: 'booking',
      relatedId: booking._id,
    });
  }

  return new ApiResponse(200, updatedBooking, 'Booking cancelled').send(res);
});

module.exports = {
  createBooking,
  getMyBookings,
  getBookingsForRide,
  respondToBooking,
  cancelBooking,
};
