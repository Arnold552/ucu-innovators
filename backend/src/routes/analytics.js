const express = require('express');
const { getDashboardStats } = require('../controllers/analyticsController');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/dashboard', auth, authorize('admin'), getDashboardStats);

module.exports = router;