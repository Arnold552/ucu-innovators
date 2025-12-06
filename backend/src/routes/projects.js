const express = require('express');
const { body } = require('express-validator');
const {
  createProject,
  getProjects,
  getProjectById,
  updateProjectStatus,
  addComment,
  getUserProjects
} = require('../controllers/projectController');
const { auth, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

router.post('/', [
  auth,
  authorize('student'),
  upload.single('document'),
  body('title').notEmpty().trim(),
  body('description').notEmpty().trim(),
  body('category_id').isInt(),
  handleValidationErrors
], createProject);

router.get('/my-projects', [
  auth,
  authorize('student')
], getUserProjects);

router.get('/', getProjects);

router.get('/:id', getProjectById);

router.patch('/:id/status', [
  auth,
  authorize('supervisor', 'admin'),
  body('status').isIn(['approved', 'rejected']),
  handleValidationErrors
], updateProjectStatus);

router.post('/:id/comments', [
  auth,
  body('comment').notEmpty().trim(),
  handleValidationErrors
], addComment);

module.exports = router;
