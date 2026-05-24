const pool = require('../config/db');
const { logActivity } = require('../middleware/activityLogger');

// ─── GET ALL USERS ────────────────────────────
const getAllUsers = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.avatar, u.created_at,
              COUNT(e.id) AS expense_count,
              COALESCE(SUM(e.amount), 0) AS total_spent
       FROM users u
       LEFT JOIN expense_items e ON e.user_id = u.id
       GROUP BY u.id
       ORDER BY u.created_at DESC`
    );
    return res.json(rows);
  } catch (err) {
    console.error('Get all users error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ─── GET USER BY ID (admin) ───────────────────
const getUserById = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, role, avatar, created_at FROM users WHERE id = ?',
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'User not found' });
    return res.json(rows[0]);
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// ─── UPDATE USER ROLE (admin) ─────────────────
const updateUserRole = async (req, res) => {
  const { role } = req.body;
  if (!['user', 'admin'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }
  try {
    await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id]);
    await logActivity(req.user.id, 'admin_update_role', `Set user ${req.params.id} role to ${role}`, req.ip);
    return res.json({ message: 'Role updated' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// ─── DELETE USER (admin) ──────────────────────
const deleteUser = async (req, res) => {
  if (parseInt(req.params.id) === req.user.id) {
    return res.status(400).json({ message: 'Cannot delete your own admin account' });
  }
  try {
    const [rows] = await pool.query('SELECT name FROM users WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'User not found' });

    await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    await logActivity(req.user.id, 'admin_delete_user', `Deleted user "${rows[0].name}"`, req.ip);
    return res.json({ message: 'User deleted' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// ─── GET ACTIVITY LOGS (admin) ────────────────
const getActivityLogs = async (req, res) => {
  const { userId, limit = 100, offset = 0 } = req.query;
  try {
    let query = `
      SELECT ua.*, u.name AS user_name, u.email AS user_email
      FROM user_activity ua
      JOIN users u ON u.id = ua.user_id
    `;
    const params = [];
    if (userId) {
      query += ' WHERE ua.user_id = ?';
      params.push(userId);
    }
    query += ' ORDER BY ua.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [rows] = await pool.query(query, params);
    return res.json(rows);
  } catch (err) {
    console.error('Activity logs error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ─── PLATFORM STATS (admin dashboard) ────────
const getPlatformStats = async (req, res) => {
  try {
    const [[userStats]] = await pool.query(`SELECT COUNT(*) AS total_users FROM users`);
    const [[expenseStats]] = await pool.query(
      `SELECT COUNT(*) AS total_expenses, COALESCE(SUM(amount), 0) AS total_amount FROM expense_items`
    );
    const [[todayActivity]] = await pool.query(
      `SELECT COUNT(*) AS count FROM user_activity WHERE DATE(created_at) = CURDATE()`
    );
    const [topSpenders] = await pool.query(
      `SELECT u.name, u.email, u.avatar, COALESCE(SUM(e.amount),0) AS total_spent
       FROM users u LEFT JOIN expense_items e ON e.user_id = u.id
       GROUP BY u.id ORDER BY total_spent DESC LIMIT 5`
    );
    return res.json({ userStats, expenseStats, todayActivity, topSpenders });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getAllUsers, getUserById, updateUserRole, deleteUser, getActivityLogs, getPlatformStats };
