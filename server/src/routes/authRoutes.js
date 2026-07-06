const express = require('express');
const authController = require('../controllers/authController');
const validate = require('../middleware/validate');
const { authLimiter, otpLimiter } = require('../middleware/rateLimiter');
const {
  registerValidator,
  loginValidator,
  verifyOtpValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} = require('../validators/authValidator');

const router = express.Router();

router.post('/register', authLimiter, registerValidator, validate, authController.register);
router.post('/verify-otp', otpLimiter, verifyOtpValidator, validate, authController.verifyOtp);
router.post('/resend-otp', otpLimiter, authController.resendOtp);
router.post('/login', authLimiter, loginValidator, validate, authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.post(
  '/forgot-password',
  otpLimiter,
  forgotPasswordValidator,
  validate,
  authController.forgotPassword
);
router.post(
  '/reset-password',
  authLimiter,
  resetPasswordValidator,
  validate,
  authController.resetPassword
);

module.exports = router;
