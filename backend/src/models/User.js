const pool = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async create(userData) {
    const { email, password, name, role, faculty, department } = userData;
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Convert faculty name to faculty_id
    let faculty_id = null;
    if (faculty) {
      const [facultyRows] = await pool.execute(
        'SELECT id FROM faculties WHERE name = ?',
        [faculty]
      );
      faculty_id = facultyRows[0]?.id || null;
    }
    
    const [result] = await pool.execute(
      'INSERT INTO users (email, password, name, role, faculty_id) VALUES (?, ?, ?, ?, ?)',
      [email, hashedPassword, name, role, faculty_id]
    );
    
    return result.insertId;
  }

  static async findByEmail(email) {
    const [users] = await pool.execute(
      'SELECT u.*, f.name as faculty_name FROM users u LEFT JOIN faculties f ON u.faculty_id = f.id WHERE u.email = ?',
      [email]
    );
    return users[0];
  }

  static async findById(id) {
    const [users] = await pool.execute(
      'SELECT u.id, u.email, u.name, u.role, u.faculty_id, f.name as faculty_name, u.created_at FROM users u LEFT JOIN faculties f ON u.faculty_id = f.id WHERE u.id = ?',
      [id]
    );
    return users[0];
  }

  static async comparePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
}

module.exports = User;