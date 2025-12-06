const pool = require('../config/database');

exports.getAllUsers = async (req, res) => {
  try {
    const { role, faculty, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT id, email, name, role, faculty_id, created_at 
      FROM users 
      WHERE 1=1
    `;
    const params = [];

    if (role) {
      query += ' AND role = ?';
      params.push(role);
    }

    if (faculty) {
      query += ' AND faculty_id = ?';
      params.push(faculty);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [users] = await pool.execute(query, params);

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
    const countParams = [];

    if (role) {
      countQuery += ' AND role = ?';
      countParams.push(role);
    }

    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error fetching users' });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const [users] = await pool.execute(
      `SELECT u.id, u.email, u.name, u.role, u.faculty_id, u.created_at, f.name as faculty_name
       FROM users u 
       LEFT JOIN faculties f ON u.faculty_id = f.id 
       WHERE u.id = ?`,
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's projects
    const [projects] = await pool.execute(
      `SELECT p.id, p.title, p.status, p.created_at, f.name as faculty_name, c.name as category_name
       FROM projects p 
       JOIN faculties f ON p.faculty_id = f.id 
       JOIN categories c ON p.category_id = c.id 
       WHERE p.student_id = ? 
       ORDER BY p.created_at DESC`,
      [id]
    );

    // If user is supervisor, get supervised projects
    const [supervisedProjects] = await pool.execute(
      `SELECT p.id, p.title, p.status, p.created_at, u.name as student_name
       FROM projects p 
       JOIN users u ON p.student_id = u.id 
       WHERE p.supervisor_id = ? 
       ORDER BY p.created_at DESC`,
      [id]
    );

    res.json({
      user: users[0],
      projects,
      supervisedProjects
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error fetching user' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, faculty_id, role } = req.body;

    // Check if user exists
    const [users] = await pool.execute('SELECT * FROM users WHERE id = ?', [id]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Admins can update any user, users can only update themselves
    if (req.user.role !== 'admin' && req.user.id !== parseInt(id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Only admins can change roles
    const updateData = { name, faculty_id };
    if (req.user.role === 'admin' && role) {
      updateData.role = role;
    }

    await pool.execute(
      'UPDATE users SET name = ?, faculty_id = ?, role = ? WHERE id = ?',
      [updateData.name, updateData.faculty_id, updateData.role, id]
    );

    const [updatedUser] = await pool.execute(
      'SELECT id, email, name, role, faculty_id, created_at FROM users WHERE id = ?',
      [id]
    );

    res.json({
      message: 'User updated successfully',
      user: updatedUser[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error updating user' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const [users] = await pool.execute('SELECT * FROM users WHERE id = ?', [id]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent users from deleting themselves
    if (req.user.id === parseInt(id)) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Check if user has projects
    const [projects] = await pool.execute('SELECT id FROM projects WHERE student_id = ?', [id]);
    if (projects.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete user with existing projects. Transfer projects first.' 
      });
    }

    await pool.execute('DELETE FROM users WHERE id = ?', [id]);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error deleting user' });
  }
};

exports.getUserStats = async (req, res) => {
  try {
    const { id } = req.params;

    // User's project statistics
    const [projectStats] = await pool.execute(
      `SELECT status, COUNT(*) as count 
       FROM projects 
       WHERE student_id = ? 
       GROUP BY status`,
      [id]
    );

    // User's comment count
    const [commentStats] = await pool.execute(
      `SELECT COUNT(*) as comment_count 
       FROM comments 
       WHERE user_id = ?`,
      [id]
    );

    // Recent activity
    const [recentProjects] = await pool.execute(
      `SELECT title, status, created_at 
       FROM projects 
       WHERE student_id = ? 
       ORDER BY created_at DESC 
       LIMIT 5`,
      [id]
    );

    const [recentComments] = await pool.execute(
      `SELECT c.comment, c.created_at, p.title as project_title 
       FROM comments c 
       JOIN projects p ON c.project_id = p.id 
       WHERE c.user_id = ? 
       ORDER BY c.created_at DESC 
       LIMIT 5`,
      [id]
    );

    res.json({
      projectStats,
      commentCount: commentStats[0]?.comment_count || 0,
      recentProjects,
      recentComments
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error fetching user stats' });
  }
};