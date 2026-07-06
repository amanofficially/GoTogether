const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { verifyAccessToken } = require('../utils/token');
const User = require('../models/User');

/**
 * Verifies the access token from the Authorization header and attaches
 * the authenticated user to req.user. Rejects banned or unverified users.
 */
const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw ApiError.unauthorized('Not authenticated. Please log in.');
  }

  const token = authHeader.split(' ')[1];

  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Access token expired');
    }
    throw ApiError.unauthorized('Invalid access token');
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    throw ApiError.unauthorized('User belonging to this token no longer exists');
  }

  if (user.isBanned) {
    throw ApiError.forbidden('Your account has been suspended. Contact support.');
  }

  req.user = user;
  next();
});

/** Restricts access to specific roles, e.g. restrictTo('admin') */
const restrictTo = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    throw ApiError.forbidden('You do not have permission to perform this action');
  }
  next();
};

/** Optional auth: attaches req.user if a valid token is present, but doesn't fail otherwise */
const optionalAuth = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const decoded = verifyAccessToken(authHeader.split(' ')[1]);
      const user = await User.findById(decoded.id);
      if (user && !user.isBanned) req.user = user;
    } catch (err) {
      // silently ignore invalid token for optional auth
    }
  }
  next();
});

module.exports = { protect, restrictTo, optionalAuth };
