const express = require('express');
const { body } = require('express-validator');
const userController = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const upload = require('../middleware/upload');

const router = express.Router();

router.use(protect); // all routes below require authentication

router.get('/me', userController.getMe);
router.patch(
  '/me',
  [
    body('name').optional().trim().isLength({ min: 2, max: 50 }),
    body('phone')
      .optional()
      .trim()
      .matches(/^\+?[0-9]{10,15}$/),
  ],
  validate,
  userController.updateMe
);
router.post('/me/avatar', upload.single('avatar'), userController.uploadAvatar);

router.patch(
  '/me/password',
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters')
      .matches(/\d/)
      .withMessage('New password must contain a number'),
  ],
  validate,
  userController.changePassword
);

router.delete(
  '/me',
  [body('password').notEmpty().withMessage('Password confirmation is required')],
  validate,
  userController.deleteMe
);

router.post(
  '/me/vehicles',
  [
    body('make').trim().notEmpty(),
    body('model').trim().notEmpty(),
    body('color').trim().notEmpty(),
    body('plateNumber').trim().notEmpty(),
    body('seats').isInt({ min: 1, max: 8 }),
  ],
  validate,
  userController.addVehicle
);
router.get('/me/vehicles', userController.getMyVehicles);
router.delete('/me/vehicles/:id', userController.deleteVehicle);

router.get('/:id', userController.getPublicProfile);

module.exports = router;
