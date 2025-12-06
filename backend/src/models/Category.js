const pool = require('../config/database');

class Category {
  static async create(categoryData) {
    const { name, description } = categoryData;
    
    const [result] = await pool.execute(
      'INSERT INTO categories (name, description) VALUES (?, ?)',
      [name, description]
    );
    
    return result.insertId;
  }

  static async findAll() {
    const [categories] = await pool.execute(
      'SELECT * FROM categories ORDER BY name'
    );
    return categories;
  }

  static async findById(id) {
    const [categories] = await pool.execute(
      'SELECT * FROM categories WHERE id = ?',
      [id]
    );
    return categories[0];
  }

  static async findByName(name) {
    const [categories] = await pool.execute(
      'SELECT * FROM categories WHERE name = ?',
      [name]
    );
    return categories[0];
  }

  static async update(id, categoryData) {
    const { name, description } = categoryData;
    
    await pool.execute(
      'UPDATE categories SET name = ?, description = ? WHERE id = ?',
      [name, description, id]
    );
    
    return this.findById(id);
  }

  static async delete(id) {
    // Check if category has projects
    const [projects] = await pool.execute('SELECT id FROM projects WHERE category_id = ? LIMIT 1', [id]);
    
    if (projects.length > 0) {
      throw new Error('Cannot delete category with associated projects');
    }

    await pool.execute('DELETE FROM categories WHERE id = ?', [id]);
    return true;
  }

  static async getCategoryStats() {
    const [stats] = await pool.execute(
      `SELECT c.id, c.name, c.description,
              COUNT(p.id) as project_count,
              COUNT(CASE WHEN p.status = 'approved' THEN p.id END) as approved_projects,
              COUNT(CASE WHEN p.status = 'pending' THEN p.id END) as pending_projects
       FROM categories c 
       LEFT JOIN projects p ON c.id = p.category_id 
       GROUP BY c.id, c.name, c.description 
       ORDER BY c.name`
    );
    return stats;
  }

  static async getProjectsByCategory(categoryId) {
    const [projects] = await pool.execute(
      `SELECT p.*, u.name as student_name, f.name as faculty_name 
       FROM projects p 
       JOIN users u ON p.student_id = u.id 
       JOIN faculties f ON p.faculty_id = f.id 
       WHERE p.category_id = ? 
       ORDER BY p.created_at DESC`,
      [categoryId]
    );
    return projects;
  }

  static async getPopularCategories(limit = 5) {
    const [categories] = await pool.execute(
      `SELECT c.id, c.name, COUNT(p.id) as project_count 
       FROM categories c 
       LEFT JOIN projects p ON c.id = p.category_id 
       GROUP BY c.id, c.name 
       ORDER BY project_count DESC 
       LIMIT ?`,
      [limit]
    );
    return categories;
  }
}

module.exports = Category;