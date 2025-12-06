const express = require('express');
const { body } = require('express-validator');
const Category = require('../models/Category');
const { auth, authorize } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// Get all categories (public)
router.get('/', async (req, res) => {
  try {
    const categories = await Category.findAll();
    res.json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error fetching categories' });
  }
});

// Get category by ID (public)
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json(category);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error fetching category' });
  }
});

// Get category statistics
router.get('/:id/stats', async (req, res) => {
  try {
    const stats = await Category.getCategoryStats();
    const categoryStats = stats.find(c => c.id === parseInt(req.params.id));
    if (!categoryStats) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json(categoryStats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error fetching category stats' });
  }
});

// Get category projects
router.get('/:id/projects', async (req, res) => {
  try {
    const projects = await Category.getProjectsByCategory(req.params.id);
    res.json(projects);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error fetching category projects' });
  }
});

// Get popular categories
router.get('/stats/popular', async (req, res) => {
  try {
    const limit = req.query.limit || 5;
    const categories = await Category.getPopularCategories(limit);
    res.json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error fetching popular categories' });
  }
});

// Create category (admin only)
router.post('/', [
  auth,
  authorize('admin'),
  body('name').notEmpty().trim(),
  body('description').optional().trim(),
  handleValidationErrors
], async (req, res) => {
  try {
    const categoryId = await Category.create(req.body);
    const category = await Category.findById(categoryId);
    res.status(201).json(category);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error creating category' });
  }
});

// Update category (admin only)
router.put('/:id', [
  auth,
  authorize('admin'),
  body('name').optional().notEmpty().trim(),
  body('description').optional().trim(),
  handleValidationErrors
], async (req, res) => {
  try {
    const category = await Category.update(req.params.id, req.body);
    res.json(category);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error updating category' });
  }
});

// Delete category (admin only)
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    await Category.delete(req.params.id);
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;