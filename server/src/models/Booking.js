const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    ride: { type: mongoose.Schema.Types.ObjectId, ref: 'Ride', required: true, index: true },
    passenger: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    seatsBooked: { type: Number, required: true, min: 1, max: 8 },
    fare: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'rejected', 'cancelled', 'completed'],
      default: 'pending',
      index: true,
    },
    pickupPoint: {
      address: String,
      coordinates: { type: [Number] },
    },
    cancellationReason: { type: String, default: '' },
  },
  { timestamps: true }
);

// A passenger cannot double-book the same ride
bookingSchema.index({ ride: 1, passenger: 1 }, { unique: true });

module.exports = mongoose.model('Booking', bookingSchema);
