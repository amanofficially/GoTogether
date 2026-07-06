const { body } = require('express-validator');

const createBookingValidator = [
  body('rideId').isMongoId().withMessage('Valid ride id is required'),
  body('seatsBooked').isInt({ min: 1, max: 8 }).withMessage('seatsBooked must be 1-8'),
];

const ratingValidator = [
  body('rideId').isMongoId().withMessage('Valid ride id is required'),
  body('toUserId').isMongoId().withMessage('Valid target user id is required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('rating must be between 1 and 5'),
  body('review').optional().isLength({ max: 500 }).withMessage('review max 500 characters'),
];

module.exports = { createBookingValidator, ratingValidator };
