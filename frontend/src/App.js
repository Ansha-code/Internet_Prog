import React, { useState, useCallback } from 'react';
import { useAuth } from './context/AuthContext';
import AuthPage     from './pages/AuthPage';
import Dashboard    from './pages/Dashboard';
import ExpensesPage from './pages/ExpensesPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SummaryPage  from './pages/SummaryPage';
import ProfilePage  from './pages/ProfilePage';
import AdminPage    from './pages/AdminPage';
import Sidebar      from './components/Sidebar';
import TopBar       from './components/TopBar';

/**
 * App is the single-page application shell.
 *
 * Navigation state is managed here with useState (not a router library)
 * so the app never triggers a full page reload — all views are rendered
 * conditionally within the same DOM tree.
 *
 * useReducer was considered but rejected here: page/modal state has no
 * complex derived transitions; simple independent useState calls are cleaner.
 */
export default function App() {
  const { user, loading } = useAuth();

  // Active page key — replaces a URL router for SPA behaviour
  const [activePage, setActivePage]   = useState('dashboard');

  // Search query lives here so TopBar and ExpensesPage share it
  const [searchQuery, setSearchQuery] = useState('');

  // Controls the "Add Expense" modal triggered from the TopBar
  const [addModalOpen, setAddModalOpen] = useState(false);

  // Clear search when navigating away from expenses page
  const handleNavigate = useCallback((page) => {
    setActivePage(page);
    if (page !== 'expenses') setSearchQuery('');
  }, []);

  // Full-page loading state while AuthContext rehydrates from localStorage
  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', flexDirection: 'column', gap: 16,
        background: 'var(--gray-50)',
      }}>
        <div style={{ fontSize: '2.5rem' }}>💳</div>
        <div className="spinner" style={{ margin: 0 }} />
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading ExpenseIQ…</p>
      </div>
    );
  }

  // Unauthenticated users see only the auth page
  if (!user) return <AuthPage />;

  // Render the active page component
  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} />;

      case 'expenses':
        return (
          <ExpensesPage
            searchQuery={searchQuery}
            modalOpen={addModalOpen}
            onModalClose={() => setAddModalOpen(false)}
          />
        );

      case 'analytics':
        return <AnalyticsPage />;

      case 'summary':
        return <SummaryPage />;

      case 'profile':
        return <ProfilePage />;

      case 'admin':
        // Guard: only admins can reach this page
        return user.role === 'admin'
          ? <AdminPage />
          : <div className="page-content">
              <div className="alert alert-error">Access denied. Admins only.</div>
            </div>;

      default:
        return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="app-layout">
      {/* ── SIDEBAR ─────────────────────────────── */}
      <Sidebar activePage={activePage} onNavigate={handleNavigate} />

      {/* ── MAIN CONTENT AREA ───────────────────── */}
      <div className="main-content">
        <TopBar
          showSearch={activePage === 'expenses'}
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          onAddExpense={
            activePage === 'expenses'
              ? () => setAddModalOpen(true)
              : () => { handleNavigate('expenses'); setAddModalOpen(true); }
          }
        />

        {/* Single-page content swap — no full reload */}
        <main>{renderPage()}</main>
      </div>
    </div>
  );
}
