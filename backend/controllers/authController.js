const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const pool = require('../config/db');
const { logActivity } = require('../middleware/activityLogger');

/** Generate a signed JWT */
const signToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

// ─── REGISTER ────────────────────────────────
const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  // Store email in lowercase for consistent lookups
  const { name, password } = req.body;
  const email = req.body.email.toLowerCase().trim();

  try {
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE LOWER(email) = ?', [email]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const avatars = ['😊', '🙂', '😎', '🤓', '🧑', '👤'];
    const avatar = avatars[Math.floor(Math.random() * avatars.length)];

    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, avatar) VALUES (?, ?, ?, ?)',
      [name.trim(), email, hashed, avatar]
    );

    const newUser = { id: result.insertId, name: name.trim(), email, role: 'user', avatar };
    await logActivity(newUser.id, 'register', `New account created for ${email}`, req.ip);

    const token = signToken(newUser);
    return res.status(201).json({ token, user: newUser });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ message: 'Server error during registration' });
  }
};

// ─── LOGIN ───────────────────────────────────
const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  // Normalise email to lowercase before lookup
  const email    = req.body.email.toLowerCase().trim();
  const password = req.body.password;

  try {
    // Case-insensitive email lookup handles mixed-case registrations
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE LOWER(email) = ?', [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    await logActivity(user.id, 'login', `Login from ${req.ip}`, req.ip);

    const token = signToken(user);
    const { password: _pw, ...safeUser } = user; // strip hash from response
    return res.json({ token, user: safeUser });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Server error during login' });
  }
};

// ─── LOGOUT ──────────────────────────────────
const logout = async (req, res) => {
  try {
    await logActivity(req.user.id, 'logout', '', req.ip);
    return res.json({ message: 'Logged out successfully' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// ─── GET PROFILE ─────────────────────────────
const getProfile = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, role, avatar, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'User not found' });
    return res.json(rows[0]);
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// ─── UPDATE PROFILE ───────────────────────────
const updateProfile = async (req, res) => {
  const { name, avatar } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'Name cannot be empty' });
  }
  try {
    await pool.query(
      'UPDATE users SET name = ?, avatar = ? WHERE id = ?',
      [name.trim(), avatar, req.user.id]
    );
    await logActivity(req.user.id, 'update_profile', 'Profile updated', req.ip);
    return res.json({ message: 'Profile updated', name: name.trim(), avatar });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// ─── CHANGE PASSWORD ──────────────────────────
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Both passwords are required' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'New password must be at least 6 characters' });
  }
  try {
    const [rows] = await pool.query('SELECT password FROM users WHERE id = ?', [req.user.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'User not found' });

    const valid = await bcrypt.compare(currentPassword, rows[0].password);
    if (!valid) return res.status(400).json({ message: 'Current password is incorrect' });

    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashed, req.user.id]);
    await logActivity(req.user.id, 'change_password', 'Password changed', req.ip);
    return res.json({ message: 'Password changed successfully' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { register, login, logout, getProfile, updateProfile, changePassword };
