const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const { uploadBuffer, deleteImage } = require('../services/uploadService');
const {
  generateAccessToken,
  generateRefreshToken,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
} = require('../utils/token');

// @route GET /api/v1/users/me
const getMe = asyncHandler(async (req, res) => {
  return new ApiResponse(200, req.user.toSafeObject(), 'Profile fetched').send(res);
});

// @route PATCH /api/v1/users/me
const updateMe = asyncHandler(async (req, res) => {
  const allowedFields = ['name', 'phone'];
  const updates = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });

  return new ApiResponse(200, user.toSafeObject(), 'Profile updated').send(res);
});

// @route POST /api/v1/users/me/avatar
const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('No image file provided');

  const user = await User.findById(req.user._id);

  if (user.avatar?.publicId) {
    await deleteImage(user.avatar.publicId);
  }

  const result = await uploadBuffer(req.file.buffer, 'gotogether/avatars');
  user.avatar = { url: result.secure_url, publicId: result.public_id };
  await user.save({ validateBeforeSave: false });

  return new ApiResponse(200, { avatar: user.avatar }, 'Avatar updated').send(res);
});

// @route GET /api/v1/users/:id  (public profile)
const getPublicProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select(
    'name avatar ratingAverage ratingCount isDriver createdAt'
  );
  if (!user) throw ApiError.notFound('User not found');
  return new ApiResponse(200, user, 'User profile fetched').send(res);
});

// @route POST /api/v1/users/me/vehicles
const addVehicle = asyncHandler(async (req, res) => {
  const { make, model, color, plateNumber, seats } = req.body;

  const existing = await Vehicle.findOne({ plateNumber: plateNumber.toUpperCase() });
  if (existing) throw ApiError.conflict('A vehicle with this plate number already exists');

  const vehicle = await Vehicle.create({
    owner: req.user._id,
    make,
    model,
    color,
    plateNumber,
    seats,
  });

  await User.findByIdAndUpdate(req.user._id, { isDriver: true });

  return new ApiResponse(201, vehicle, 'Vehicle added successfully').send(res);
});

// @route GET /api/v1/users/me/vehicles
const getMyVehicles = asyncHandler(async (req, res) => {
  const vehicles = await Vehicle.find({ owner: req.user._id });
  return new ApiResponse(200, vehicles, 'Vehicles fetched').send(res);
});

// @route DELETE /api/v1/users/me/vehicles/:id
const deleteVehicle = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findOne({ _id: req.params.id, owner: req.user._id });
  if (!vehicle) throw ApiError.notFound('Vehicle not found');
  await vehicle.deleteOne();
  return new ApiResponse(200, null, 'Vehicle removed').send(res);
});

// @route PATCH /api/v1/users/me/password
// Requires the current password so a stolen access token alone can't
// hijack the account; rotates tokens afterwards so this session stays
// valid while every other session is signed out.
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(currentPassword))) {
    throw ApiError.unauthorized('Current password is incorrect');
  }
  if (currentPassword === newPassword) {
    throw ApiError.badRequest('New password must be different from the current password');
  }

  user.password = newPassword;
  await user.save();

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });
  setRefreshTokenCookie(res, refreshToken);

  return new ApiResponse(200, { accessToken }, 'Password updated successfully').send(res);
});

// @route DELETE /api/v1/users/me
// Requires the current password as a final confirmation before permanently
// removing the account, to protect against session hijacking / accidental clicks.
const deleteMe = asyncHandler(async (req, res) => {
  const { password } = req.body;

  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Password is incorrect');
  }

  await Vehicle.deleteMany({ owner: user._id });
  await user.deleteOne();
  clearRefreshTokenCookie(res);

  return new ApiResponse(200, null, 'Account deleted successfully').send(res);
});

module.exports = {
  getMe,
  updateMe,
  uploadAvatar,
  getPublicProfile,
  addVehicle,
  getMyVehicles,
  deleteVehicle,
  changePassword,
  deleteMe,
};
