const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const Ride = require('../models/Ride');
const Vehicle = require('../models/Vehicle');
const Booking = require('../models/Booking');
const Notification = require('../models/Notification');

const SEARCH_RADIUS_METERS = 5000; // 5km radius for pickup/drop matching

// @route POST /api/v1/rides
const createRide = asyncHandler(async (req, res) => {
  const { vehicle, origin, destination, waypoints, departureTime, totalSeats, pricePerSeat, preferences } =
    req.body;

  const ownedVehicle = await Vehicle.findOne({ _id: vehicle, owner: req.user._id });
  if (!ownedVehicle) throw ApiError.badRequest('Vehicle not found or does not belong to you');

  if (totalSeats > ownedVehicle.seats) {
    throw ApiError.badRequest(`Vehicle only supports up to ${ownedVehicle.seats} seats`);
  }

  const ride = await Ride.create({
    driver: req.user._id,
    vehicle,
    origin: { address: origin.address, coordinates: origin.coordinates },
    destination: { address: destination.address, coordinates: destination.coordinates },
    waypoints: waypoints || [],
    departureTime,
    totalSeats,
    availableSeats: totalSeats,
    pricePerSeat,
    preferences,
  });

  return new ApiResponse(201, ride, 'Ride created successfully').send(res);
});

// @route GET /api/v1/rides/search
// Smart route matching: finds rides whose origin is near the passenger's
// pickup point AND whose destination is near the passenger's drop point.
const searchRides = asyncHandler(async (req, res) => {
  const { originLng, originLat, destinationLng, destinationLat, date, seats } = req.query;

  const matchStage = {
    status: 'scheduled',
    availableSeats: { $gte: parseInt(seats, 10) || 1 },
  };

  // Only apply geo filters when a full origin/destination pair is given,
  // so the same endpoint can also power a generic "browse upcoming rides" view.
  if (originLng !== undefined && originLat !== undefined) {
    matchStage['origin.coordinates'] = {
      $geoWithin: {
        $centerSphere: [[parseFloat(originLng), parseFloat(originLat)], SEARCH_RADIUS_METERS / 6378137],
      },
    };
  }
  if (destinationLng !== undefined && destinationLat !== undefined) {
    matchStage['destination.coordinates'] = {
      $geoWithin: {
        $centerSphere: [
          [parseFloat(destinationLng), parseFloat(destinationLat)],
          SEARCH_RADIUS_METERS / 6378137,
        ],
      },
    };
  }

  if (date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    matchStage.departureTime = { $gte: start, $lte: end };
  } else {
    matchStage.departureTime = { $gte: new Date() };
  }

  const rides = await Ride.find(matchStage)
    .populate('driver', 'name avatar ratingAverage ratingCount')
    .populate('vehicle', 'make model color plateNumber isVerified')
    .sort({ departureTime: 1 })
    .limit(50);

  return new ApiResponse(200, rides, `${rides.length} matching rides found`).send(res);
});

// @route GET /api/v1/rides/:id
const getRideById = asyncHandler(async (req, res) => {
  const ride = await Ride.findById(req.params.id)
    .populate('driver', 'name avatar ratingAverage ratingCount phone')
    .populate('vehicle', 'make model color plateNumber seats isVerified');
  if (!ride) throw ApiError.notFound('Ride not found');
  return new ApiResponse(200, ride, 'Ride fetched').send(res);
});

// @route GET /api/v1/rides/me/offered
const getMyOfferedRides = asyncHandler(async (req, res) => {
  const rides = await Ride.find({ driver: req.user._id })
    .populate('driver', 'name avatar ratingAverage ratingCount')
    .populate('vehicle', 'make model color plateNumber isVerified')
    .sort({ departureTime: -1 });
  return new ApiResponse(200, rides, 'Offered rides fetched').send(res);
});

// @route PATCH /api/v1/rides/:id/status
const updateRideStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const allowed = ['ongoing', 'completed', 'cancelled'];
  if (!allowed.includes(status)) throw ApiError.badRequest('Invalid status value');

  const ride = await Ride.findOne({ _id: req.params.id, driver: req.user._id });
  if (!ride) throw ApiError.notFound('Ride not found or you are not the driver');

  if (ride.status === 'completed' || ride.status === 'cancelled') {
    throw ApiError.badRequest(`Ride is already ${ride.status} and cannot be updated`);
  }

  ride.status = status;
  if (status === 'cancelled') {
    ride.cancellationReason = req.body.reason || 'Cancelled by driver';
    // Reject/cancel all pending or confirmed bookings and notify passengers
    const bookings = await Booking.find({ ride: ride._id, status: { $in: ['pending', 'confirmed'] } });
    await Booking.updateMany(
      { ride: ride._id, status: { $in: ['pending', 'confirmed'] } },
      { status: 'cancelled', cancellationReason: 'Ride cancelled by driver' }
    );
    await Notification.insertMany(
      bookings.map((b) => ({
        user: b.passenger,
        title: 'Ride Cancelled',
        message: `Your ride scheduled for ${ride.departureTime.toDateString()} was cancelled by the driver.`,
        type: 'ride',
        relatedId: ride._id,
      }))
    );
  }

  if (status === 'completed') {
    // Carry every confirmed booking on this ride over to "completed" too —
    // this is what unlocks the passenger's rate & review flow, and is what
    // "My bookings" / "Ride history" use to know the trip is actually over.
    const confirmedBookings = await Booking.find({ ride: ride._id, status: 'confirmed' });
    await Booking.updateMany({ ride: ride._id, status: 'confirmed' }, { status: 'completed' });

    const io = req.app.get('io');
    await Promise.all(
      confirmedBookings.map(async (b) => {
        const notification = await Notification.create({
          user: b.passenger,
          title: 'Ride Completed',
          message: `Your ride to ${ride.destination.address} is complete. Rate your driver and leave a review!`,
          type: 'ride',
          relatedId: ride._id,
        });
        io?.to(`user:${b.passenger}`).emit('notification:new', notification);
      })
    );
  }

  await ride.save();
  return new ApiResponse(200, ride, `Ride marked as ${status}`).send(res);
});

// @route PATCH /api/v1/rides/:id/location  (live tracking)
const updateRideLocation = asyncHandler(async (req, res) => {
  const { lng, lat } = req.body;
  if (typeof lng !== 'number' || typeof lat !== 'number') {
    throw ApiError.badRequest('lng and lat must be numbers');
  }

  const ride = await Ride.findOneAndUpdate(
    { _id: req.params.id, driver: req.user._id, status: 'ongoing' },
    { currentLocation: { type: 'Point', coordinates: [lng, lat] } },
    { new: true }
  );

  if (!ride) throw ApiError.notFound('Ongoing ride not found for this driver');

  // Broadcast live location to ride room via Socket.io
  req.app.get('io')?.to(`ride:${ride._id}`).emit('driver:location', {
    rideId: ride._id,
    coordinates: [lng, lat],
    timestamp: new Date(),
  });

  return new ApiResponse(200, { coordinates: [lng, lat] }, 'Location updated').send(res);
});

module.exports = {
  createRide,
  searchRides,
  getRideById,
  getMyOfferedRides,
  updateRideStatus,
  updateRideLocation,
};
