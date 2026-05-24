const { validationResult } = require('express-validator');
const pool = require('../config/db');
const { logActivity } = require('../middleware/activityLogger');

// ─── CREATE EXPENSE ──────────────────────────
const createExpense = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  const { title, category, amount, expense_date, description } = req.body;
  try {
    const [result] = await pool.query(
      `INSERT INTO expense_items (user_id, title, category, amount, expense_date, description)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.user.id, title, category, amount, expense_date, description || '']
    );
    const [newRow] = await pool.query('SELECT * FROM expense_items WHERE id = ?', [result.insertId]);
    await logActivity(req.user.id, 'create_expense', `Created "${title}" — $${amount}`, req.ip);
    return res.status(201).json(newRow[0]);
  } catch (err) {
    console.error('Create expense error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ─── GET ALL EXPENSES ─────────────────────────
const getExpenses = async (req, res) => {
  const { search, category, startDate, endDate, sortBy = 'expense_date', order = 'DESC' } = req.query;
  const allowedSorts = ['expense_date', 'amount', 'title', 'category', 'created_at'];
  const safeSort  = allowedSorts.includes(sortBy) ? sortBy : 'expense_date';
  const safeOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  try {
    let query = `SELECT * FROM expense_items WHERE user_id = ?`;
    const params = [req.user.id];
    if (search) {
      query += ` AND (title LIKE ? OR description LIKE ? OR category LIKE ?)`;
      const t = `%${search}%`;
      params.push(t, t, t);
    }
    if (category && category !== 'All') { query += ` AND category = ?`; params.push(category); }
    if (startDate) { query += ` AND expense_date >= ?`; params.push(startDate); }
    if (endDate)   { query += ` AND expense_date <= ?`; params.push(endDate); }
    query += ` ORDER BY ${safeSort} ${safeOrder}`;
    const [rows] = await pool.query(query, params);
    return res.json(rows);
  } catch (err) {
    console.error('Get expenses error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ─── GET SINGLE EXPENSE ───────────────────────
const getExpenseById = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM expense_items WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Expense not found' });
    return res.json(rows[0]);
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// ─── UPDATE EXPENSE ───────────────────────────
const updateExpense = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  const { title, category, amount, expense_date, description } = req.body;
  try {
    const [existing] = await pool.query(
      'SELECT id FROM expense_items WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (existing.length === 0) return res.status(404).json({ message: 'Expense not found' });

    await pool.query(
      `UPDATE expense_items SET title=?, category=?, amount=?, expense_date=?, description=?
       WHERE id = ? AND user_id = ?`,
      [title, category, amount, expense_date, description || '', req.params.id, req.user.id]
    );
    const [updated] = await pool.query('SELECT * FROM expense_items WHERE id = ?', [req.params.id]);
    await logActivity(req.user.id, 'update_expense', `Updated "${title}"`, req.ip);
    return res.json(updated[0]);
  } catch (err) {
    console.error('Update expense error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ─── DELETE EXPENSE ───────────────────────────
const deleteExpense = async (req, res) => {
  try {
    const [existing] = await pool.query(
      'SELECT id, title FROM expense_items WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (existing.length === 0) return res.status(404).json({ message: 'Expense not found' });
    await pool.query('DELETE FROM expense_items WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    await logActivity(req.user.id, 'delete_expense', `Deleted "${existing[0].title}"`, req.ip);
    return res.json({ message: 'Expense deleted' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// ─── ANALYTICS: by category (all-time) ───────
// CAST forces MySQL to return real numbers instead of decimal strings,
// which Recharts requires to render pie/bar charts correctly.
const getCategoryTotals = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT category,
              CAST(COUNT(*)    AS UNSIGNED)     AS count,
              CAST(SUM(amount) AS DECIMAL(12,2)) AS total,
              CAST(AVG(amount) AS DECIMAL(12,2)) AS average,
              CAST(MAX(amount) AS DECIMAL(12,2)) AS max_amount
       FROM expense_items
       WHERE user_id = ?
       GROUP BY category
       ORDER BY total DESC`,
      [req.user.id]
    );
    // Extra JS parse as a safety net in case the driver still returns strings
    const parsed = rows.map(r => ({
      ...r,
      count:      Number(r.count),
      total:      Number(r.total),
      average:    Number(r.average),
      max_amount: Number(r.max_amount),
    }));
    return res.json(parsed);
  } catch (err) {
    console.error('getCategoryTotals error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ─── ANALYTICS: monthly trend ────────────────
// Anchors to the MAX expense date so historical/seed data always renders.
const getMonthlyTrend = async (req, res) => {
  const { months = 12 } = req.query;
  try {
    const [[anchor]] = await pool.query(
      `SELECT MAX(expense_date) AS latest FROM expense_items WHERE user_id = ?`,
      [req.user.id]
    );
    if (!anchor || !anchor.latest) return res.json([]);

    const [rows] = await pool.query(
      `SELECT DATE_FORMAT(expense_date, '%Y-%m')   AS month,
              CAST(SUM(amount) AS DECIMAL(12,2))    AS total,
              CAST(COUNT(*)    AS UNSIGNED)          AS count
       FROM expense_items
       WHERE user_id = ?
         AND expense_date >= DATE_SUB(?, INTERVAL ? MONTH)
       GROUP BY month
       ORDER BY month ASC`,
      [req.user.id, anchor.latest, parseInt(months)]
    );
    const parsed = rows.map(r => ({
      ...r,
      total: Number(r.total),
      count: Number(r.count),
    }));
    return res.json(parsed);
  } catch (err) {
    console.error('getMonthlyTrend error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ─── ANALYTICS: summary / overview ──────────
// Anchors to MAX expense date so stat cards always populate from seed data.
const getSummary = async (req, res) => {
  try {
    const [[anchor]] = await pool.query(
      `SELECT MAX(expense_date) AS latest FROM expense_items WHERE user_id = ?`,
      [req.user.id]
    );

    if (!anchor || !anchor.latest) {
      return res.json({
        currentMonth:  { total: 0, count: 0 },
        previousMonth: { total: 0 },
        topCategory:   null,
        allTime:       { total: 0 },
        latestMonth:   null,
      });
    }

    const latestDate = anchor.latest; // Date object from mysql2

    // Current = same YEAR-MONTH as the user's latest expense
    const [[current]] = await pool.query(
      `SELECT CAST(COALESCE(SUM(amount), 0) AS DECIMAL(12,2)) AS total,
              CAST(COUNT(*) AS UNSIGNED)                       AS count
       FROM expense_items
       WHERE user_id = ?
         AND DATE_FORMAT(expense_date, '%Y-%m') = DATE_FORMAT(?, '%Y-%m')`,
      [req.user.id, latestDate]
    );

    // Previous = one month before the latest expense
    const [[previous]] = await pool.query(
      `SELECT CAST(COALESCE(SUM(amount), 0) AS DECIMAL(12,2)) AS total
       FROM expense_items
       WHERE user_id = ?
         AND DATE_FORMAT(expense_date, '%Y-%m') = DATE_FORMAT(DATE_SUB(?, INTERVAL 1 MONTH), '%Y-%m')`,
      [req.user.id, latestDate]
    );

    // Top category in the latest month
    const [topCat] = await pool.query(
      `SELECT category,
              CAST(SUM(amount) AS DECIMAL(12,2)) AS total
       FROM expense_items
       WHERE user_id = ?
         AND DATE_FORMAT(expense_date, '%Y-%m') = DATE_FORMAT(?, '%Y-%m')
       GROUP BY category
       ORDER BY total DESC
       LIMIT 1`,
      [req.user.id, latestDate]
    );

    // All-time total
    const [[allTime]] = await pool.query(
      `SELECT CAST(COALESCE(SUM(amount), 0) AS DECIMAL(12,2)) AS total
       FROM expense_items WHERE user_id = ?`,
      [req.user.id]
    );

    // Format latestDate as "YYYY-MM" string (mysql2 returns a Date object)
    const latestDateObj = new Date(latestDate);
    const latestMonth = `${latestDateObj.getFullYear()}-${String(latestDateObj.getMonth() + 1).padStart(2, '0')}`;

    return res.json({
      currentMonth:  { total: Number(current.total),  count: Number(current.count) },
      previousMonth: { total: Number(previous.total) },
      topCategory:   topCat[0] ? { ...topCat[0], total: Number(topCat[0].total) } : null,
      allTime:       { total: Number(allTime.total) },
      latestMonth,   // e.g. "2025-05"
    });
  } catch (err) {
    console.error('getSummary error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  getCategoryTotals,
  getMonthlyTrend,
  getSummary,
};
