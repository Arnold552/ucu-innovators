const pool = require('../config/database');

class Faculty {
  static async create(facultyData) {
    const { name, code } = facultyData;
    
    const [result] = await pool.execute(
      'INSERT INTO faculties (name, code) VALUES (?, ?)',
      [name, code]
    );
    
    return result.insertId;
  }

  static async findAll() {
    const [faculties] = await pool.execute(
      'SELECT * FROM faculties ORDER BY name'
    );
    return faculties;
  }

  static async findById(id) {
    const [faculties] = await pool.execute(
      'SELECT * FROM faculties WHERE id = ?',
      [id]
    );
    return faculties[0];
  }

  static async findByCode(code) {
    const [faculties] = await pool.execute(
      'SELECT * FROM faculties WHERE code = ?',
      [code]
    );
    return faculties[0];
  }

  static async update(id, facultyData) {
    const { name, code } = facultyData;
    
    await pool.execute(
      'UPDATE faculties SET name = ?, code = ? WHERE id = ?',
      [name, code, id]
    );
    
    return this.findById(id);
  }

  static async delete(id) {
    // Check if faculty has users or projects
    const [users] = await pool.execute('SELECT id FROM users WHERE faculty_id = ? LIMIT 1', [id]);
    const [projects] = await pool.execute('SELECT id FROM projects WHERE faculty_id = ? LIMIT 1', [id]);
    
    if (users.length > 0 || projects.length > 0) {
      throw new Error('Cannot delete faculty with associated users or projects');
    }

    await pool.execute('DELETE FROM faculties WHERE id = ?', [id]);
    return true;
  }

  static async getFacultyStats() {
    const [stats] = await pool.execute(
      `SELECT f.id, f.name, f.code, 
              COUNT(DISTINCT u.id) as user_count,
              COUNT(DISTINCT p.id) as project_count,
              COUNT(DISTINCT CASE WHEN p.status = 'approved' THEN p.id END) as approved_projects
       FROM faculties f 
       LEFT JOIN users u ON f.id = u.faculty_id 
       LEFT JOIN projects p ON f.id = p.faculty_id 
       GROUP BY f.id, f.name, f.code 
       ORDER BY f.name`
    );
    return stats;
  }

  static async getProjectsByFaculty(facultyId) {
    const [projects] = await pool.execute(
      `SELECT p.*, u.name as student_name, c.name as category_name 
       FROM projects p 
       JOIN users u ON p.student_id = u.id 
       JOIN categories c ON p.category_id = c.id 
       WHERE p.faculty_id = ? 
       ORDER BY p.created_at DESC`,
      [facultyId]
    );
    return projects;
  }
}

module.exports = Faculty;