const express = require('express');
const { body } = require('express-validator');
const { register, login, getMe } = require('../controllers/authController');
const { auth } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').notEmpty().trim(),
  body('role').isIn(['student', 'supervisor', 'admin']),
  handleValidationErrors
], register);

router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').exists(),
  handleValidationErrors
], login);

router.get('/me', auth, getMe);

module.exports = router;