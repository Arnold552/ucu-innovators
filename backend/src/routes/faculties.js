const express = require('express');
const { body } = require('express-validator');
const Faculty = require('../models/Faculty');
const { auth, authorize } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// Get all faculties (public)
router.get('/', async (req, res) => {
  try {
    const faculties = await Faculty.findAll();
    res.json(faculties);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error fetching faculties' });
  }
});

// Get faculty by ID (public)
router.get('/:id', async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.params.id);
    if (!faculty) {
      return res.status(404).json({ error: 'Faculty not found' });
    }
    res.json(faculty);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error fetching faculty' });
  }
});

// Get faculty statistics
router.get('/:id/stats', async (req, res) => {
  try {
    const stats = await Faculty.getFacultyStats();
    const facultyStats = stats.find(f => f.id === parseInt(req.params.id));
    if (!facultyStats) {
      return res.status(404).json({ error: 'Faculty not found' });
    }
    res.json(facultyStats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error fetching faculty stats' });
  }
});

// Get faculty projects
router.get('/:id/projects', async (req, res) => {
  try {
    const projects = await Faculty.getProjectsByFaculty(req.params.id);
    res.json(projects);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error fetching faculty projects' });
  }
});

// Create faculty (admin only)
router.post('/', [
  auth,
  authorize('admin'),
  body('name').notEmpty().trim(),
  body('code').notEmpty().trim(),
  handleValidationErrors
], async (req, res) => {
  try {
    const facultyId = await Faculty.create(req.body);
    const faculty = await Faculty.findById(facultyId);
    res.status(201).json(faculty);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error creating faculty' });
  }
});

// Update faculty (admin only)
router.put('/:id', [
  auth,
  authorize('admin'),
  body('name').optional().notEmpty().trim(),
  body('code').optional().notEmpty().trim(),
  handleValidationErrors
], async (req, res) => {
  try {
    const faculty = await Faculty.update(req.params.id, req.body);
    res.json(faculty);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error updating faculty' });
  }
});

// Delete faculty (admin only)
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    await Faculty.delete(req.params.id);
    res.json({ message: 'Faculty deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;