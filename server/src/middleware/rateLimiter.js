const rateLimit = require('express-rate-limit');
const { rateLimit: cfg } = require('../config/env');

const apiLimiter = rateLimit({
  windowMs: cfg.windowMs,
  max: cfg.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

// Stricter limiter for auth endpoints (login, register, OTP) to slow brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please try again in 15 minutes.' },
});

const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many OTP requests. Please wait before retrying.' },
});

module.exports = { apiLimiter, authLimiter, otpLimiter };
