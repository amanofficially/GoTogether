const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema(
  {
    ride: { type: mongoose.Schema.Types.ObjectId, ref: 'Ride', required: true, index: true },
    from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    review: { type: String, trim: true, maxlength: 500, default: '' },
  },
  { timestamps: true }
);

// One rating per (ride, from, to) triple - prevents duplicate reviews
ratingSchema.index({ ride: 1, from: 1, to: 1 }, { unique: true });

module.exports = mongoose.model('Rating', ratingSchema);
