import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useExpenses } from '../hooks/useExpenses';

const navItems = [
  { id: 'dashboard', icon: '📊', label: 'Dashboard' },
  { id: 'expenses',  icon: '💸', label: 'Expenses' },
  { id: 'analytics', icon: '📈', label: 'Analytics' },
  { id: 'summary',   icon: '💡', label: 'Summary View' },
];

const adminItems = [
  { id: 'admin', icon: '🛡️', label: 'Admin Panel' },
];

export default function Sidebar({ activePage, onNavigate }) {
  const { user, logout }      = useAuth();
  const { resetExpenses }     = useExpenses();

  const handleLogout = () => {
    // Reset expense state before clearing auth so stale data
    // never flashes on screen if another user logs in after.
    logout(resetExpenses);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h2>Pocket<span>Guard</span></h2>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Main</div>
        {navItems.map(item => (
          <button
            key={item.id}
            className={`nav-item ${activePage === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </button>
        ))}

        {user?.role === 'admin' && (
          <>
            <div className="nav-section-label" style={{ marginTop: 8 }}>Admin</div>
            {adminItems.map(item => (
              <button
                key={item.id}
                className={`nav-item ${activePage === item.id ? 'active' : ''}`}
                onClick={() => onNavigate(item.id)}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </>
        )}

        <div className="nav-section-label" style={{ marginTop: 8 }}>Account</div>
        <button
          className={`nav-item ${activePage === 'profile' ? 'active' : ''}`}
          onClick={() => onNavigate('profile')}
        >
          <span className="nav-icon">👤</span>
          My Profile
        </button>
      </nav>

      <div className="sidebar-footer">
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 12px', borderRadius: 8,
          background: 'rgba(255,255,255,0.08)', marginBottom: 8,
        }}>
          <span style={{ fontSize: '1.3rem' }}>{user?.avatar || '👤'}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: '#fff', fontSize: '0.82rem', fontWeight: 600,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.7rem' }}>
              {user?.role}
            </div>
          </div>
        </div>

        <button className="nav-item" onClick={handleLogout} style={{ color: '#fca5a5' }}>
          <span className="nav-icon">🚪</span>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
