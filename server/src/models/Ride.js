const mongoose = require('mongoose');

const geoPointSchema = new mongoose.Schema(
  {
    address: { type: String, required: true },
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: {
      // [longitude, latitude] - GeoJSON order
      type: [Number],
      required: true,
      validate: {
        validator: (val) => Array.isArray(val) && val.length === 2,
        message: 'Coordinates must be [longitude, latitude]',
      },
    },
  },
  { _id: false }
);

const rideSchema = new mongoose.Schema(
  {
    driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },

    origin: { type: geoPointSchema, required: true },
    destination: { type: geoPointSchema, required: true },
    waypoints: { type: [geoPointSchema], default: [] },

    departureTime: { type: Date, required: true, index: true },
    estimatedArrivalTime: { type: Date },

    totalSeats: { type: Number, required: true, min: 1, max: 8 },
    availableSeats: { type: Number, required: true, min: 0 },

    pricePerSeat: { type: Number, required: true, min: 0 },

    status: {
      type: String,
      enum: ['scheduled', 'ongoing', 'completed', 'cancelled'],
      default: 'scheduled',
      index: true,
    },

    preferences: {
      smokingAllowed: { type: Boolean, default: false },
      petsAllowed: { type: Boolean, default: false },
      womenOnly: { type: Boolean, default: false },
      instantBooking: { type: Boolean, default: true },
    },

    // Live tracking during an ongoing ride. Intentionally has NO defaults:
    // if neither `type` nor `coordinates` is set, Mongoose omits the whole
    // field, and MongoDB's 2dsphere index simply skips documents that don't
    // have it (sparse by default for geo indexes). If `type` had a default
    // but `coordinates` didn't, every new ride would be saved with a
    // half-formed GeoJSON point ({ type: "Point" }, no coordinates), which
    // MongoDB rejects as invalid GeoJSON when building the index — that was
    // the cause of the "Can't extract geo keys" / "Point must be an array
    // or object, instead got type missing" error on ride creation.
    currentLocation: {
      type: { type: String, enum: ['Point'] },
      coordinates: { type: [Number] },
    },

    cancellationReason: { type: String, default: '' },
  },
  { timestamps: true }
);

rideSchema.index({ 'origin.coordinates': '2dsphere' });
rideSchema.index({ 'destination.coordinates': '2dsphere' });
rideSchema.index({ currentLocation: '2dsphere' });
rideSchema.index({ departureTime: 1, status: 1 });

rideSchema.pre('save', function enforceSeatConsistency(next) {
  if (this.availableSeats > this.totalSeats) {
    return next(new Error('availableSeats cannot exceed totalSeats'));
  }
  next();
});

module.exports = mongoose.model('Ride', rideSchema);
