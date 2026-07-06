const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    make: { type: String, required: true, trim: true },
    model: { type: String, required: true, trim: true },
    color: { type: String, required: true, trim: true },
    plateNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    seats: { type: Number, required: true, min: 1, max: 8 },
    isVerified: { type: Boolean, default: false },
    documents: [
      {
        type: { type: String }, // e.g. RC, insurance
        url: String,
        publicId: String,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Vehicle', vehicleSchema);
