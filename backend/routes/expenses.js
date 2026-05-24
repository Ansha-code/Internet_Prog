const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  getCategoryTotals,
  getMonthlyTrend,
  getSummary,
} = require('../controllers/expenseController');
const { authenticate } = require('../middleware/auth');

// All expense routes require authentication
router.use(authenticate);

const expenseRules = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 150 }),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('amount').isFloat({ gt: 0 }).withMessage('Amount must be a positive number'),
  body('expense_date').isDate().withMessage('Valid date is required'),
];

router.get('/', getExpenses);
router.post('/', expenseRules, createExpense);
router.get('/analytics/categories', getCategoryTotals);
router.get('/analytics/monthly', getMonthlyTrend);
router.get('/analytics/summary', getSummary);
router.get('/:id', getExpenseById);
router.put('/:id', expenseRules, updateExpense);
router.delete('/:id', deleteExpense);

module.exports = router;
