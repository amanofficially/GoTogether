const express = require('express');
const ratingController = require('../controllers/ratingController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { ratingValidator } = require('../validators/bookingValidator');

const router = express.Router();

router.get('/user/:userId', ratingController.getUserRatings);
router.use(protect);
router.get('/mine', ratingController.getMyRatings);
router.post('/', ratingValidator, validate, ratingController.createRating);

module.exports = router;
