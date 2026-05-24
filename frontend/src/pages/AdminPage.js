import React, { useEffect, useState, useCallback } from 'react';
import api from '../utils/api';
import { formatCurrency } from '../utils/constants';
import ConfirmDialog from '../components/ConfirmDialog';

export default function AdminPage() {
  const [tab,      setTab]      = useState('users');   // 'users' | 'activity' | 'stats'
  const [users,    setUsers]    = useState([]);
  const [activity, setActivity] = useState([]);
  const [stats,    setStats]    = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [delTarget, setDelTarget] = useState(null);
  const [toast,    setToast]    = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/users');
      setUsers(data);
    } catch {}
    setLoading(false);
  }, []);

  const loadActivity = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/activity', { params: { limit: 100 } });
      setActivity(data);
    } catch {}
    setLoading(false);
  }, []);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/stats');
      setStats(data);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    if (tab === 'users')    loadUsers();
    if (tab === 'activity') loadActivity();
    if (tab === 'stats')    loadStats();
  }, [tab, loadUsers, loadActivity, loadStats]);

  const handleRoleToggle = async (user) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    try {
      await api.put(`/admin/users/${user.id}/role`, { role: newRole });
      setUsers(us => us.map(u => u.id === user.id ? { ...u, role: newRole } : u));
      showToast(`${user.name} is now ${newRole}`);
    } catch {
      showToast('Failed to update role');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/admin/users/${delTarget.id}`);
      setUsers(us => us.filter(u => u.id !== delTarget.id));
      showToast(`${delTarget.name} deleted`);
    } catch (e) {
      showToast(e.response?.data?.message || 'Delete failed');
    }
    setDelTarget(null);
  };

  const ACTION_LABELS = {
    login:           { label: 'Login',           color: 'var(--success)' },
    logout:          { label: 'Logout',           color: 'var(--gray-400)' },
    register:        { label: 'Register',         color: 'var(--blue-500)' },
    create_expense:  { label: 'Added Expense',    color: 'var(--primary)' },
    update_expense:  { label: 'Edited Expense',   color: 'var(--warning)' },
    delete_expense:  { label: 'Deleted Expense',  color: 'var(--danger)' },
    update_profile:  { label: 'Profile Update',   color: 'var(--blue-300)' },
    change_password: { label: 'Password Change',  color: 'var(--warning)' },
  };

  return (
    <div className="page-content">
      {toast && (
        <div className="alert alert-success" style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, margin: 0, minWidth: 240 }}>
          {toast}
        </div>
      )}

      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 4 }}>🛡️ Admin Panel</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Manage users and monitor platform activity
        </p>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[
          { id: 'users',    label: '👥 Users' },
          { id: 'activity', label: '📋 Activity Log' },
          { id: 'stats',    label: '📊 Platform Stats' },
        ].map(t => (
          <button
            key={t.id}
            className={`btn ${tab === t.id ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── USERS TAB ──────────────────────────────── */}
      {tab === 'users' && (
        <div className="card">
          <div className="card-header">
            <h3>All User Accounts ({users.length})</h3>
            <button className="btn btn-ghost btn-sm" onClick={loadUsers}>↺ Refresh</button>
          </div>
          <div className="card-body" style={{ paddingTop: 12 }}>
            {loading ? (
              <div className="loading-wrap"><div className="spinner" /></div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Expenses</th>
                      <th className="text-right">Total Spent</th>
                      <th>Joined</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: '1.2rem' }}>{u.avatar || '👤'}</span>
                            <span className="fw-600">{u.name}</span>
                          </div>
                        </td>
                        <td className="text-muted">{u.email}</td>
                        <td>
                          <span className="badge" style={{
                            background: u.role === 'admin' ? 'var(--blue-50)' : 'var(--gray-100)',
                            color: u.role === 'admin' ? 'var(--primary)' : 'var(--text-secondary)',
                            border: `1px solid ${u.role === 'admin' ? 'var(--blue-200)' : 'var(--border)'}`,
                          }}>
                            {u.role === 'admin' ? '👑' : '👤'} {u.role}
                          </span>
                        </td>
                        <td>{u.expense_count}</td>
                        <td className="text-right text-mono">{formatCurrency(u.total_spent)}</td>
                        <td className="text-muted" style={{ fontSize: '0.8rem' }}>
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => handleRoleToggle(u)}
                              title={u.role === 'admin' ? 'Revoke admin' : 'Grant admin'}
                            >
                              {u.role === 'admin' ? '⬇️' : '⬆️'}
                            </button>
                            <button
                              className="btn btn-sm"
                              style={{ background: 'var(--danger-light)', color: 'var(--danger)', border: 'none' }}
                              onClick={() => setDelTarget(u)}
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── ACTIVITY LOG TAB ────────────────────────── */}
      {tab === 'activity' && (
        <div className="card">
          <div className="card-header">
            <h3>Activity Log (last 100)</h3>
            <button className="btn btn-ghost btn-sm" onClick={loadActivity}>↺ Refresh</button>
          </div>
          <div className="card-body" style={{ paddingTop: 12 }}>
            {loading ? (
              <div className="loading-wrap"><div className="spinner" /></div>
            ) : activity.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📋</div>
                <h4>No activity yet</h4>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Action</th>
                      <th>Detail</th>
                      <th>IP</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activity.map(a => {
                      const label = ACTION_LABELS[a.action] || { label: a.action, color: 'var(--gray-400)' };
                      return (
                        <tr key={a.id}>
                          <td>
                            <span className="fw-600">{a.user_name}</span>
                            <span className="text-muted" style={{ fontSize: '0.75rem', display: 'block' }}>
                              {a.user_email}
                            </span>
                          </td>
                          <td>
                            <span className="badge" style={{
                              background: `${label.color}18`,
                              color: label.color,
                              border: `1px solid ${label.color}40`,
                            }}>
                              {label.label}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: 220,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {a.detail || '—'}
                          </td>
                          <td className="text-muted" style={{ fontSize: '0.78rem' }}>{a.ip_address || '—'}</td>
                          <td className="text-muted" style={{ fontSize: '0.78rem' }}>
                            {new Date(a.created_at).toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── PLATFORM STATS TAB ─────────────────────── */}
      {tab === 'stats' && stats && (
        <div>
          <div className="stat-grid" style={{ marginBottom: 20 }}>
            <div className="stat-card">
              <div className="stat-icon blue">👥</div>
              <div className="stat-info">
                <div className="stat-label">Total Users</div>
                <div className="stat-value">{stats.userStats.total_users}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon green">💸</div>
              <div className="stat-info">
                <div className="stat-label">Total Expenses</div>
                <div className="stat-value">{stats.expenseStats.total_expenses}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon amber">💰</div>
              <div className="stat-info">
                <div className="stat-label">Platform Volume</div>
                <div className="stat-value" style={{ fontSize: '1.2rem' }}>
                  {formatCurrency(stats.expenseStats.total_amount)}
                </div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon blue">📅</div>
              <div className="stat-info">
                <div className="stat-label">Today's Actions</div>
                <div className="stat-value">{stats.todayActivity.count}</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><h3>🏆 Top Spenders</h3></div>
            <div className="card-body" style={{ paddingTop: 12 }}>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>User</th>
                      <th className="text-right">Total Spent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.topSpenders.map((u, i) => (
                      <tr key={u.email}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontWeight: 700, color: i === 0 ? '#f59e0b' : 'var(--text-muted)', minWidth: 20 }}>
                              #{i+1}
                            </span>
                            <span style={{ fontSize: '1.1rem' }}>{u.avatar || '👤'}</span>
                            <div>
                              <div className="fw-600">{u.name}</div>
                              <div className="text-muted" style={{ fontSize: '0.75rem' }}>{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="text-right text-mono fw-600" style={{ color: 'var(--primary)' }}>
                          {formatCurrency(u.total_spent)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {delTarget && (
        <ConfirmDialog
          title="Delete User"
          message={`Permanently delete "${delTarget.name}" and all their expense data? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDelTarget(null)}
        />
      )}
    </div>
  );
}
