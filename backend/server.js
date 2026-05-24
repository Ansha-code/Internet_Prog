require('dotenv').config();
const express = require('express');
const cors = require('cors');

// ─── STARTUP VALIDATION ───────────────────────
// Provide a clear warning (not a silent mid-request crash) when .env is missing.
if (!process.env.JWT_SECRET) {
  console.warn('⚠️  JWT_SECRET not found in .env — using insecure dev fallback. Create backend/.env!');
  process.env.JWT_SECRET = 'dev_fallback_secret_change_in_production';
}

const authRoutes    = require('./routes/auth');
const expenseRoutes = require('./routes/expenses');
const adminRoutes   = require('./routes/admin');

const app = express();

// ─── MIDDLEWARE ────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── ROUTES ───────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/admin',    adminRoutes);

// ─── HEALTH CHECK ─────────────────────────────
app.get('/api/health', (req, res) =>
  res.json({ status: 'ok', timestamp: new Date() })
);

// ─── 404 HANDLER ──────────────────────────────
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

// ─── GLOBAL ERROR HANDLER ─────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

// ─── START ────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
