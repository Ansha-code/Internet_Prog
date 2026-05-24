import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { ExpenseProvider } from './context/ExpenseContext';

/**
 * Provider order:
 * AuthProvider  — outermost, since ExpenseProvider's API calls need the JWT
 *                 that AuthContext stores in localStorage/headers.
 * ExpenseProvider — single shared store; all pages (Dashboard, Analytics,
 *                   Summary) read from the same state, so one fetch populates
 *                   every chart and card without re-fetching on navigation.
 */
const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <AuthProvider>
      <ExpenseProvider>
        <App />
      </ExpenseProvider>
    </AuthProvider>
  </React.StrictMode>
);
