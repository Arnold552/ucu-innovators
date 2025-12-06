const express = require('express');
const { body } = require('express-validator');
const {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserStats
} = require('../controllers/userController');
const { auth, authorize } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// All routes require authentication
router.use(auth);

// Get all users (admin only, or supervisors for their faculty)
router.get('/', authorize('admin', 'supervisor'), getAllUsers);

// Get user by ID
router.get('/:id', getUserById);

// Get user statistics
router.get('/:id/stats', getUserStats);

// Update user
router.put('/:id', [
  body('name').optional().notEmpty().trim(),
  body('faculty_id').optional().isInt(),
  body('role').optional().isIn(['student', 'supervisor', 'admin']),
  handleValidationErrors
], updateUser);

// Delete user (admin only)
router.delete('/:id', authorize('admin'), deleteUser);

module.exports = router;