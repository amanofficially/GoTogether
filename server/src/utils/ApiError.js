class ApiError extends Error {
  /**
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Human-readable error message
   * @param {Array} errors - Optional array of field-level validation errors
   * @param {boolean} isOperational - true for expected/handled errors
   * @param {string|null} code - Optional machine-readable error code (e.g.
   *   'EMAIL_NOT_VERIFIED') so clients can branch on the error type without
   *   matching against the human-readable message text.
   */
  constructor(statusCode, message = 'Something went wrong', errors = [], isOperational = true, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = isOperational;
    this.code = code;
    this.success = false;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, errors = []) {
    return new ApiError(400, message, errors);
  }

  static unauthorized(message = 'Unauthorized') {
    return new ApiError(401, message);
  }

  static forbidden(message = 'Forbidden', code = null) {
    return new ApiError(403, message, [], true, code);
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(404, message);
  }

  static conflict(message = 'Conflict') {
    return new ApiError(409, message);
  }

  static internal(message = 'Internal server error') {
    return new ApiError(500, message, [], false);
  }
}

module.exports = ApiError;
