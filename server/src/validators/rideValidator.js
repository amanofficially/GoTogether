const { body, query } = require('express-validator');

const coordsValidator = (field) =>
  body(field.parent)
    .isObject()
    .withMessage(`${field.parent} is required`)
    .bail()
    .custom((val) => {
      if (!val.address || typeof val.address !== 'string') {
        throw new Error(`${field.parent}.address is required`);
      }
      if (
        !Array.isArray(val.coordinates) ||
        val.coordinates.length !== 2 ||
        val.coordinates.some((c) => typeof c !== 'number')
      ) {
        throw new Error(`${field.parent}.coordinates must be [longitude, latitude]`);
      }
      return true;
    });

const createRideValidator = [
  body('vehicle').isMongoId().withMessage('Valid vehicle id is required'),
  coordsValidator({ parent: 'origin' }),
  coordsValidator({ parent: 'destination' }),
  body('departureTime')
    .isISO8601()
    .withMessage('Valid departure time is required')
    .custom((val) => new Date(val) > new Date())
    .withMessage('Departure time must be in the future'),
  body('totalSeats').isInt({ min: 1, max: 8 }).withMessage('Total seats must be 1-8'),
  body('pricePerSeat').isFloat({ min: 0 }).withMessage('Price per seat must be a positive number'),
];

const searchRideValidator = [
  // Coordinates are optional so the client can also browse all upcoming
  // rides (e.g. dashboard) without a specific route in mind.
  query('originLng').optional().isFloat().withMessage('originLng must be a number'),
  query('originLat').optional().isFloat().withMessage('originLat must be a number'),
  query('destinationLng').optional().isFloat().withMessage('destinationLng must be a number'),
  query('destinationLat').optional().isFloat().withMessage('destinationLat must be a number'),
  query('date').optional().isISO8601().withMessage('date must be a valid ISO date'),
  query('seats').optional().isInt({ min: 1, max: 8 }).withMessage('seats must be 1-8'),
];

module.exports = { createRideValidator, searchRideValidator };
