const pool = require('../config/database');
const Project = require('../models/Project');

exports.createProject = async (req, res) => {
  try {
    console.log('=== CREATE PROJECT ===');
    console.log('User:', req.user);
    console.log('Request body:', req.body);
    console.log('File:', req.file);
    
    const {
      title,
      description,
      category_id,
      technologies,
      github_link,
      demo_link,
      document_path
    } = req.body;

    // Validate required fields
    if (!title || !description || !category_id) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'Title, description, and category are required'
      });
    }

    // Get student's faculty_id from users table
    const [userRows] = await pool.execute(
      'SELECT faculty_id FROM users WHERE id = ?',
      [req.user.id]
    );
    
    if (userRows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const faculty_id = userRows[0].faculty_id;
    
    if (!faculty_id) {
      return res.status(400).json({ 
        error: 'User not associated with faculty',
        details: 'Please contact admin to assign you to a faculty'
      });
    }

    // Parse technologies if it's a string
    let techArray = [];
    if (technologies) {
      if (typeof technologies === 'string') {
        techArray = technologies.split(',').map(tech => tech.trim());
      } else if (Array.isArray(technologies)) {
        techArray = technologies;
      }
    }

    // Create project data object
    const projectData = {
      title,
      description,
      student_id: req.user.id,
      faculty_id,
      category_id: parseInt(category_id), // Ensure it's a number
      technologies: techArray,
      github_link: github_link || null,
      demo_link: demo_link || null,
      document_path: document_path || (req.file ? req.file.path : null)
    };

    console.log('Creating project with data:', projectData);

    // Use the Project model to create
    const projectId = await Project.create(projectData);
    
    // Fetch the complete project
    const project = await Project.findById(projectId);
    
    console.log('Project created successfully:', projectId);

    res.status(201).json({
      message: 'Project submitted successfully! It is now pending review.',
      project: project
    });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ 
      error: 'Server error creating project',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

exports.getUserProjects = async (req, res) => {
  try {
    console.log('Getting projects for user:', req.user.id);
    
    // Use the Project model
    const projects = await Project.findByStudentId(req.user.id);
    
    console.log(`Found ${projects.length} projects for user ${req.user.id}`);
    
    res.json(projects);
  } catch (error) {
    console.error('Error fetching user projects:', error);
    res.status(500).json({ 
      error: 'Server error fetching projects',
      details: error.message 
    });
  }
};

// Add this missing function for getting all projects
exports.getProjects = async (req, res) => {
  try {
    const { status = 'approved' } = req.query;
    console.log('Getting all projects with status:', status);
    
    // Use the Project model
    const projects = await Project.findAll({ status });
    
    console.log(`Found ${projects.length} projects`);
    
    res.json({
      projects,
      count: projects.length
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ 
      error: 'Server error fetching projects',
      details: error.message 
    });
  }
};

// Add other missing controller functions
exports.getProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Getting project by ID:', id);
    
    const project = await Project.findById(id);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json({ project });
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: 'Server error fetching project' });
  }
};

exports.updateProjectStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, feedback } = req.body;
    
    console.log('Updating project status:', { id, status, feedback });
    
    const project = await Project.updateStatus(id, status, feedback, req.user.id);
    
    res.json({ 
      message: `Project ${status} successfully`,
      project 
    });
  } catch (error) {
    console.error('Error updating project status:', error);
    res.status(500).json({ error: 'Server error updating project status' });
  }
};

exports.addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    
    console.log('Adding comment to project:', id);
    
    const [result] = await pool.execute(
      'INSERT INTO comments (project_id, user_id, comment) VALUES (?, ?, ?)',
      [id, req.user.id, comment]
    );
    
    res.status(201).json({
      message: 'Comment added successfully',
      commentId: result.insertId
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'Server error adding comment' });
  }
};