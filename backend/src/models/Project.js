const pool = require('../config/database');

class Project {
  static async create(projectData) {
    const {
      title,
      description,
      student_id,
      faculty_id,
      category_id,
      technologies,
      github_link,
      demo_link,
      document_path
    } = projectData;

    console.log('Inserting project with data:', {
      title, 
      student_id, 
      faculty_id,
      category_id,
      technologies: technologies ? 'present' : 'null'
    });

    try {
      const [result] = await pool.execute(
        `INSERT INTO projects 
        (title, description, student_id, faculty_id, category_id, 
         technologies, github_link, demo_link, document_path, status, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())`,
        [
          title,
          description,
          student_id,
          faculty_id,
          category_id,
          JSON.stringify(technologies || []),
          github_link || null,
          demo_link || null,
          document_path || null
        ]
      );

      console.log('Project inserted with ID:', result.insertId);
      return result.insertId;
    } catch (error) {
      console.error('Database error in Project.create:', error);
      throw error;
    }
  }

  static async findById(id) {
    try {
      const [projects] = await pool.execute(
        `SELECT p.*, 
         u.name as student_name, 
         u2.name as supervisor_name,
         f.name as faculty_name, 
         c.name as category_name 
         FROM projects p 
         LEFT JOIN users u ON p.student_id = u.id 
         LEFT JOIN users u2 ON p.supervisor_id = u2.id 
         LEFT JOIN faculties f ON p.faculty_id = f.id 
         LEFT JOIN categories c ON p.category_id = c.id 
         WHERE p.id = ?`,
        [id]
      );
      return projects[0];
    } catch (error) {
      console.error('Database error in Project.findById:', error);
      throw error;
    }
  }

  static async findAll(filters = {}) {
    try {
      const { status, faculty_id, category_id, page = 1, limit = 10 } = filters;
      const offset = (page - 1) * limit;

      let query = `
        SELECT p.*, 
        u.name as student_name, 
        u2.name as supervisor_name,
        f.name as faculty_name, 
        c.name as category_name 
        FROM projects p 
        LEFT JOIN users u ON p.student_id = u.id 
        LEFT JOIN users u2 ON p.supervisor_id = u2.id 
        LEFT JOIN faculties f ON p.faculty_id = f.id 
        LEFT JOIN categories c ON p.category_id = c.id 
        WHERE 1=1
      `;
      const params = [];

      if (status) {
        query += ' AND p.status = ?';
        params.push(status);
      }

      if (faculty_id) {
        query += ' AND p.faculty_id = ?';
        params.push(faculty_id);
      }

      if (category_id) {
        query += ' AND p.category_id = ?';
        params.push(category_id);
      }

      query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
      params.push(parseInt(limit), offset);

      const [projects] = await pool.execute(query, params);
      return projects;
    } catch (error) {
      console.error('Database error in Project.findAll:', error);
      throw error;
    }
  }

  static async findByStudentId(studentId) {
    try {
      const [projects] = await pool.execute(
        `SELECT p.*, 
         f.name as faculty_name, 
         c.name as category_name,
         u2.name as supervisor_name
         FROM projects p 
         LEFT JOIN faculties f ON p.faculty_id = f.id 
         LEFT JOIN categories c ON p.category_id = c.id 
         LEFT JOIN users u2 ON p.supervisor_id = u2.id 
         WHERE p.student_id = ? 
         ORDER BY p.created_at DESC`,
        [studentId]
      );
      return projects;
    } catch (error) {
      console.error('Database error in Project.findByStudentId:', error);
      throw error;
    }
  }

  static async updateStatus(id, status, feedback, supervisor_id) {
    try {
      await pool.execute(
        'UPDATE projects SET status = ?, feedback = ?, supervisor_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [status, feedback, supervisor_id, id]
      );
      return this.findById(id);
    } catch (error) {
      console.error('Database error in Project.updateStatus:', error);
      throw error;
    }
  }

  // ... other methods remain similar
}

module.exports = Project;