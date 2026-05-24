const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { register, login, logout, getProfile, updateProfile, changePassword } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

// Validation rules
const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
  // normalizeEmail() intentionally omitted — it strips dots/plus aliases and
  // can cause the stored email to differ from what the user types at login.
  body('email').isEmail().toLowerCase().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
];

const loginRules = [
  // Use toLowerCase only — avoids normalizeEmail() transforming the address
  // (e.g. removing dots) and causing a DB lookup mismatch.
  body('email').isEmail().toLowerCase().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

router.post('/register', registerRules, register);
router.post('/login',    loginRules,    login);
router.post('/logout',   authenticate,  logout);
router.get('/profile',   authenticate,  getProfile);
router.put('/profile',   authenticate,  updateProfile);
router.put('/change-password', authenticate, changePassword);

module.exports = router;
