const ApiError = require('../utils/ApiError');
const logger = require('../config/logger');
const { isProd } = require('../config/env');

function notFound(req, res, next) {
  next(ApiError.notFound(`Route not found - ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let error = err;

  // Normalize known Mongoose/JS errors into ApiError
  if (error.name === 'CastError') {
    error = ApiError.badRequest(`Invalid ${error.path}: ${error.value}`);
  } else if (error.code === 11000) {
    const field = Object.keys(error.keyValue || {})[0];
    error = ApiError.conflict(`Duplicate value for field: ${field}`);
  } else if (error.name === 'ValidationError') {
    const messages = Object.values(error.errors).map((e) => e.message);
    error = ApiError.badRequest('Validation failed', messages);
  } else if (error.name === 'JsonWebTokenError') {
    error = ApiError.unauthorized('Invalid token');
  } else if (error.name === 'TokenExpiredError') {
    error = ApiError.unauthorized('Token expired');
  } else if (!(error instanceof ApiError)) {
    error = new ApiError(error.statusCode || 500, error.message || 'Internal server error', [], false);
  }

  const { statusCode = 500, message, errors = [], isOperational, code } = error;

  if (!isOperational || statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl} - ${message}`, { stack: err.stack });
  } else {
    logger.warn(`${req.method} ${req.originalUrl} - ${message}`);
  }

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    errors,
    ...(code ? { code } : {}),
    ...(isProd ? {} : { stack: err.stack }),
  });
}

module.exports = { notFound, errorHandler };
