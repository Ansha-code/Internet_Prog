import React, { createContext, useContext, useReducer, useCallback } from 'react';
import api from '../utils/api';

/**
 * ExpenseContext — single shared store for all expense data.
 *
 * WHY CONTEXT HERE:
 * useExpenses() was previously a plain custom hook, meaning each page
 * (Dashboard, AnalyticsPage, SummaryPage) that called it got its own
 * isolated useReducer instance. Data fetched on Dashboard was invisible
 * to AnalyticsPage. Moving to Context means one fetch populates every
 * consumer simultaneously, and switching pages never re-fetches.
 */

const ExpenseContext = createContext(null);

const initialState = {
  expenses:       [],
  loading:        false,
  error:          null,
  summary:        null,
  categoryTotals: [],
  monthlyTrend:   [],
};

function expenseReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':         return { ...state, loading: action.loading };
    case 'SET_ERROR':           return { ...state, error: action.error, loading: false };
    case 'SET_EXPENSES':        return { ...state, expenses: action.expenses, loading: false };
    case 'ADD_EXPENSE':         return { ...state, expenses: [action.expense, ...state.expenses] };
    case 'UPDATE_EXPENSE':      return { ...state, expenses: state.expenses.map(e => e.id === action.expense.id ? action.expense : e) };
    case 'DELETE_EXPENSE':      return { ...state, expenses: state.expenses.filter(e => e.id !== action.id) };
    case 'SET_SUMMARY':         return { ...state, summary: action.summary };
    case 'SET_CATEGORY_TOTALS': return { ...state, categoryTotals: action.totals };
    case 'SET_MONTHLY_TREND':   return { ...state, monthlyTrend: action.trend };
    case 'RESET':               return initialState;
    default: return state;
  }
}

// Force all numeric fields returned by MySQL SUM/AVG/COUNT to JS numbers.
// MySQL drivers return aggregated values as strings; Recharts needs real numbers.
const parseCategory = (row) => ({
  ...row,
  total:      parseFloat(row.total)      || 0,
  average:    parseFloat(row.average)    || 0,
  max_amount: parseFloat(row.max_amount) || 0,
  count:      parseInt(row.count)        || 0,
});

const parseTrend = (row) => ({
  ...row,
  total: parseFloat(row.total) || 0,
  count: parseInt(row.count)   || 0,
});

export function ExpenseProvider({ children }) {
  const [state, dispatch] = useReducer(expenseReducer, initialState);

  const fetchExpenses = useCallback(async (params = {}) => {
    dispatch({ type: 'SET_LOADING', loading: true });
    try {
      const { data } = await api.get('/expenses', { params });
      dispatch({ type: 'SET_EXPENSES', expenses: data });
    } catch (err) {
      console.error('fetchExpenses error:', err);
      dispatch({ type: 'SET_ERROR', error: err.response?.data?.message || 'Failed to load expenses' });
    }
  }, []);

  const createExpense = useCallback(async (payload) => {
    try {
      const { data } = await api.post('/expenses', payload);
      dispatch({ type: 'ADD_EXPENSE', expense: data });
      return { success: true, data };
    } catch (err) {
      const msg = err.response?.data?.errors?.[0]?.msg || err.response?.data?.message || 'Failed to create expense';
      return { success: false, message: msg };
    }
  }, []);

  const updateExpense = useCallback(async (id, payload) => {
    try {
      const { data } = await api.put(`/expenses/${id}`, payload);
      dispatch({ type: 'UPDATE_EXPENSE', expense: data });
      return { success: true, data };
    } catch (err) {
      const msg = err.response?.data?.errors?.[0]?.msg || err.response?.data?.message || 'Failed to update expense';
      return { success: false, message: msg };
    }
  }, []);

  const deleteExpense = useCallback(async (id) => {
    try {
      await api.delete(`/expenses/${id}`);
      dispatch({ type: 'DELETE_EXPENSE', id });
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Failed to delete expense' };
    }
  }, []);

  const fetchSummary = useCallback(async () => {
    try {
      const { data } = await api.get('/expenses/analytics/summary');
      // Parse all numeric fields so stat cards display correctly
      const parsed = {
        ...data,
        currentMonth:  {
          total: parseFloat(data.currentMonth?.total)  || 0,
          count: parseInt(data.currentMonth?.count)    || 0,
        },
        previousMonth: {
          total: parseFloat(data.previousMonth?.total) || 0,
        },
        topCategory: data.topCategory ? {
          ...data.topCategory,
          total: parseFloat(data.topCategory.total)    || 0,
        } : null,
        allTime: {
          total: parseFloat(data.allTime?.total)       || 0,
        },
      };
      dispatch({ type: 'SET_SUMMARY', summary: parsed });
    } catch (err) {
      console.error('fetchSummary error:', err);
    }
  }, []);

  const fetchCategoryTotals = useCallback(async () => {
    try {
      const { data } = await api.get('/expenses/analytics/categories');
      dispatch({ type: 'SET_CATEGORY_TOTALS', totals: data.map(parseCategory) });
    } catch (err) {
      console.error('fetchCategoryTotals error:', err);
    }
  }, []);

  const fetchMonthlyTrend = useCallback(async (months = 12) => {
    try {
      const { data } = await api.get('/expenses/analytics/monthly', { params: { months } });
      dispatch({ type: 'SET_MONTHLY_TREND', trend: data.map(parseTrend) });
    } catch (err) {
      console.error('fetchMonthlyTrend error:', err);
    }
  }, []);

  // Called on logout so stale data doesn't leak between accounts
  const resetExpenses = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  return (
    <ExpenseContext.Provider value={{
      ...state,
      fetchExpenses,
      createExpense,
      updateExpense,
      deleteExpense,
      fetchSummary,
      fetchCategoryTotals,
      fetchMonthlyTrend,
      resetExpenses,
    }}>
      {children}
    </ExpenseContext.Provider>
  );
}

export const useExpenses = () => {
  const ctx = useContext(ExpenseContext);
  if (!ctx) throw new Error('useExpenses must be used inside ExpenseProvider');
  return ctx;
};
