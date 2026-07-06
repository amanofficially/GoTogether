const express = require('express');
const { body } = require('express-validator');
const bookingController = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createBookingValidator } = require('../validators/bookingValidator');

const router = express.Router();

router.use(protect);

router.post('/', createBookingValidator, validate, bookingController.createBooking);
router.get('/me', bookingController.getMyBookings);
router.get('/ride/:rideId', bookingController.getBookingsForRide);
router.patch(
  '/:id/respond',
  [body('action').isIn(['approve', 'reject'])],
  validate,
  bookingController.respondToBooking
);
router.patch('/:id/cancel', bookingController.cancelBooking);

module.exports = router;
