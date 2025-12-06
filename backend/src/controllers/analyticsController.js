const pool = require('../config/database');

exports.getDashboardStats = async (req, res) => {
  try {
    // Total projects count
    const [totalProjects] = await pool.execute(
      'SELECT COUNT(*) as count FROM projects'
    );

    // Projects by status
    const [projectsByStatus] = await pool.execute(
      'SELECT status, COUNT(*) as count FROM projects GROUP BY status'
    );

    // Projects by faculty
    const [projectsByFaculty] = await pool.execute(
      `SELECT f.name as faculty, COUNT(p.id) as count 
       FROM faculties f 
       LEFT JOIN projects p ON f.id = p.faculty_id 
       GROUP BY f.id, f.name`
    );

    // Projects by category
    const [projectsByCategory] = await pool.execute(
      `SELECT c.name as category, COUNT(p.id) as count 
       FROM categories c 
       LEFT JOIN projects p ON c.id = p.category_id 
       GROUP BY c.id, c.name`
    );

    // Recent projects
    const [recentProjects] = await pool.execute(
      `SELECT p.title, p.status, p.created_at, u.name as student_name 
       FROM projects p 
       JOIN users u ON p.student_id = u.id 
       ORDER BY p.created_at DESC 
       LIMIT 5`
    );

    // Most active students
    const [activeStudents] = await pool.execute(
      `SELECT u.name, COUNT(p.id) as project_count 
       FROM users u 
       JOIN projects p ON u.id = p.student_id 
       WHERE u.role = 'student' 
       GROUP BY u.id, u.name 
       ORDER BY project_count DESC 
       LIMIT 5`
    );

    res.json({
      totalProjects: totalProjects[0].count,
      projectsByStatus,
      projectsByFaculty,
      projectsByCategory,
      recentProjects,
      activeStudents
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error fetching analytics' });
  }
};