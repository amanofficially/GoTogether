const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const User = require('../models/User');
const { generateOtp, hashOtp, compareOtp } = require('../utils/otp');
const { sendOtpEmail } = require('../services/emailService');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
} = require('../utils/token');
const { otp: otpConfig, jwt: jwtConfig } = require('../config/env');
const logger = require('../config/logger');

/** Helper: issues access+refresh tokens, persists refresh token, sets cookie */
async function issueTokens(user, res) {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  user.refreshToken = refreshToken;
  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });
  setRefreshTokenCookie(res, refreshToken);
  return accessToken;
}

// @route POST /api/v1/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body;

  const existing = await User.findOne({ $or: [{ email }, { phone }] });
  if (existing) {
    throw ApiError.conflict('An account with this email or phone already exists');
  }

  const otp = generateOtp();
  const user = await User.create({
    name,
    email,
    phone,
    password,
    otp: hashOtp(otp),
    otpExpiry: new Date(Date.now() + otpConfig.expiryMinutes * 60 * 1000),
  });

  try {
    await sendOtpEmail(email, otp, 'verification');
  } catch (err) {
    logger.error(`OTP email failed for ${email}: ${err.message}`);
    // Do not fail registration just because the email provider hiccupped;
    // the user can request a resend.
  }

  return new ApiResponse(
    201,
    { userId: user._id, email: user.email },
    'Registration successful. Please verify the OTP sent to your email.'
  ).send(res);
});

// @route POST /api/v1/auth/verify-otp
const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  const user = await User.findOne({ email }).select('+otp +otpExpiry');
  if (!user) throw ApiError.notFound('User not found');
  if (user.isVerified) throw ApiError.badRequest('Account is already verified');

  if (!user.otp || !user.otpExpiry || user.otpExpiry < new Date()) {
    throw ApiError.badRequest('OTP has expired. Please request a new one.');
  }

  if (!compareOtp(otp, user.otp)) {
    throw ApiError.badRequest('Invalid OTP');
  }

  user.isVerified = true;
  user.otp = undefined;
  user.otpExpiry = undefined;
  await user.save({ validateBeforeSave: false });

  const accessToken = await issueTokens(user, res);

  return new ApiResponse(
    200,
    { accessToken, user: user.toSafeObject() },
    'Email verified successfully'
  ).send(res);
});

// @route POST /api/v1/auth/resend-otp
const resendOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) throw ApiError.notFound('User not found');
  if (user.isVerified) throw ApiError.badRequest('Account is already verified');

  const otp = generateOtp();
  user.otp = hashOtp(otp);
  user.otpExpiry = new Date(Date.now() + otpConfig.expiryMinutes * 60 * 1000);
  await user.save({ validateBeforeSave: false });

  await sendOtpEmail(email, otp, 'verification');

  return new ApiResponse(200, null, 'OTP resent successfully').send(res);
});

// @route POST /api/v1/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  if (user.isBanned) {
    throw ApiError.forbidden('Your account has been suspended. Contact support.');
  }

  if (!user.isVerified) {
    throw ApiError.forbidden('Please verify your email before logging in', 'EMAIL_NOT_VERIFIED');
  }

  const accessToken = await issueTokens(user, res);

  return new ApiResponse(200, { accessToken, user: user.toSafeObject() }, 'Login successful').send(
    res
  );
});

// @route POST /api/v1/auth/refresh
const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.[jwtConfig.cookieName];
  if (!token) throw ApiError.unauthorized('No refresh token provided');

  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch (err) {
    clearRefreshTokenCookie(res);
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }

  const user = await User.findById(decoded.id).select('+refreshToken');
  if (!user || user.refreshToken !== token) {
    clearRefreshTokenCookie(res);
    throw ApiError.unauthorized('Refresh token mismatch. Please log in again.');
  }

  // Rotate refresh token on every use to limit replay window
  const accessToken = await issueTokens(user, res);

  return new ApiResponse(200, { accessToken }, 'Token refreshed').send(res);
});

// @route POST /api/v1/auth/logout
const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.[jwtConfig.cookieName];
  if (token) {
    try {
      const decoded = verifyRefreshToken(token);
      await User.findByIdAndUpdate(decoded.id, { $unset: { refreshToken: 1 } });
    } catch (err) {
      // token already invalid; nothing to clean up server-side
    }
  }
  clearRefreshTokenCookie(res);
  return new ApiResponse(200, null, 'Logged out successfully').send(res);
});

// @route POST /api/v1/auth/forgot-password
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  // Always respond the same way to avoid leaking which emails are registered
  if (user) {
    const otp = generateOtp();
    user.passwordResetToken = hashOtp(otp);
    user.passwordResetExpiry = new Date(Date.now() + otpConfig.expiryMinutes * 60 * 1000);
    await user.save({ validateBeforeSave: false });
    await sendOtpEmail(email, otp, 'reset');
  }

  return new ApiResponse(
    200,
    null,
    'If an account exists for this email, a password reset OTP has been sent.'
  ).send(res);
});

// @route POST /api/v1/auth/reset-password
const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;

  const user = await User.findOne({ email }).select('+passwordResetToken +passwordResetExpiry');
  if (!user || !user.passwordResetToken || !user.passwordResetExpiry) {
    throw ApiError.badRequest('Invalid or expired reset request');
  }

  if (user.passwordResetExpiry < new Date()) {
    throw ApiError.badRequest('OTP has expired. Please request a new one.');
  }

  if (!compareOtp(otp, user.passwordResetToken)) {
    throw ApiError.badRequest('Invalid OTP');
  }

  user.password = newPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpiry = undefined;
  user.refreshToken = undefined; // force re-login on all devices
  await user.save();

  clearRefreshTokenCookie(res);
  return new ApiResponse(200, null, 'Password reset successful. Please log in.').send(res);
});

module.exports = {
  register,
  verifyOtp,
  resendOtp,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
};
