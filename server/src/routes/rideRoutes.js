const express = require('express');
const { body } = require('express-validator');
const rideController = require('../controllers/rideController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createRideValidator, searchRideValidator } = require('../validators/rideValidator');

const router = express.Router();

router.get('/search', searchRideValidator, validate, rideController.searchRides);

router.use(protect);

router.post('/', createRideValidator, validate, rideController.createRide);
router.get('/me/offered', rideController.getMyOfferedRides);
router.get('/:id', rideController.getRideById);
router.patch(
  '/:id/status',
  [body('status').isIn(['ongoing', 'completed', 'cancelled'])],
  validate,
  rideController.updateRideStatus
);
router.patch(
  '/:id/location',
  [body('lng').isFloat(), body('lat').isFloat()],
  validate,
  rideController.updateRideLocation
);

module.exports = router;
