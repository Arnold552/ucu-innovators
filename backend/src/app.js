const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Routes
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const analyticsRoutes = require('./routes/analytics');
const userRoutes = require('./routes/users');
const facultyRoutes = require('./routes/faculties');
const categoryRoutes = require('./routes/categories');

const app = express();


// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);


// CORS configuration (important for connecting frontend)

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
}));


// Body Parsing

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));


// Static files (uploads)

app.use('/uploads', express.static('uploads'));


// API Routes

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/faculties', facultyRoutes);
app.use('/api/categories', categoryRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ message: 'UCU Innovators Hub API is running' });
});


// SERVE FRONTEND (React Vite build in production)

const frontendPath = path.join(__dirname, '../../frontend/exams/dist');

app.use(express.static(frontendPath));

// ... other imports and middleware ...

// Serve static files from the React app
app.use(express.static(frontendPath));

// Explicit routes for React app
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.get('/student', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.get('/supervisor', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.get('/project/:id', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// 404 handler for unknown routes (should be after all routes)
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});


// Error handling

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});


// START SERVER

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});