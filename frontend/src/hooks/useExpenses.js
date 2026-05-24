/**
 * useExpenses — re-exported from ExpenseContext.
 *
 * Previously this was a plain custom hook (useReducer inside the hook itself),
 * which meant every component that called useExpenses() got its own isolated
 * state. Dashboard fetched summary data that AnalyticsPage couldn't see.
 *
 * Now it's a context consumer: one shared store, one set of fetch calls,
 * all pages in sync. The hook signature is identical so no page components
 * needed to change their import paths.
 */
export { useExpenses } from '../context/ExpenseContext';
