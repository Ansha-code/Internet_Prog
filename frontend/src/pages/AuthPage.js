import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AuthPage() {
  const { login, register } = useAuth();

  const [mode,    setMode]    = useState('login');
  const [form,    setForm]    = useState({ name: '', email: '', password: '' });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setError(''); // clear error as soon as user starts retyping
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Client-side validation first
    if (mode === 'register') {
      if (form.name.trim().length < 2)
        return setError('Name must be at least 2 characters.');
      if (form.password.length < 6)
        return setError('Password must be at least 6 characters.');
    }

    setLoading(true);

    const result = mode === 'login'
      ? await login(form.email, form.password)
      : await register(form.name, form.email, form.password);

    setLoading(false);

    // If failed, set error — login() no longer touches context state
    // so this setError call is guaranteed to stick and render.
    if (!result.success) {
      setError(result.message || 'Something went wrong. Please try again.');
    }
  };

  const toggleMode = () => {
    setMode(m => m === 'login' ? 'register' : 'login');
    setError('');
    setForm({ name: '', email: '', password: '' });
  };

  const hasError = Boolean(error);

  return (
    <div className="auth-layout">
      {/* ── LEFT BRANDING PANEL ─────────────────── */}
      <div className="auth-left">
        <div style={{ maxWidth: 420 }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>💳</div>
          <h1 style={{ fontSize: '2.4rem', fontWeight: 800, marginBottom: 16, lineHeight: 1.1 }}>
            Take control of your finances
          </h1>
          <p style={{ fontSize: '1.05rem', opacity: 0.8, lineHeight: 1.7 }}>
            Track expenses, discover spending patterns, and build smarter money habits: all in one place.
          </p>
          <div style={{ display: 'flex', gap: 24, marginTop: 40, opacity: 0.85 }}>
            {['📊 Analytics', '🔍 Live Search', '💡 Smart Tips'].map(f => (
              <div key={f} style={{ fontSize: '0.85rem', fontWeight: 600 }}>{f}</div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT FORM PANEL ────────────────────── */}
      <div className="auth-right">
        <div className="auth-box">
          <div className="auth-logo">
            Pocket<span style={{ color: 'var(--blue-600)' }}>Guard</span>
          </div>

          <h2 className="auth-title">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="auth-subtitle">
            {mode === 'login'
              ? 'Sign in to continue tracking your expenses'
              : 'Start managing your spending smarter today'}
          </p>

          {/* ── ERROR BANNER ──────────────────────── */}
          {hasError && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fca5a5',
              borderRadius: 8,
              padding: '12px 14px',
              marginBottom: 20,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
            }}>
              <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>⚠️</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: '#991b1b', fontSize: '0.875rem', marginBottom: 2 }}>
                  {mode === 'login' ? 'Login failed' : 'Sign up failed'}
                </div>
                <div style={{ color: '#b91c1c', fontSize: '0.83rem' }}>{error}</div>
                {/* Hint to register if they typed wrong credentials */}
                {mode === 'login' && (
                  <div style={{ marginTop: 8, fontSize: '0.8rem', color: '#991b1b' }}>
                    New here?{' '}
                    <button
                      type="button"
                      onClick={toggleMode}
                      style={{
                        background: 'none', border: 'none', padding: 0,
                        cursor: 'pointer', fontWeight: 700, color: '#991b1b',
                        textDecoration: 'underline', fontSize: '0.8rem',
                      }}
                    >
                      Create a free account →
                    </button>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setError('')}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#991b1b', fontSize: '1rem', lineHeight: 1, padding: 0,
                }}
                title="Dismiss"
              >
                ✕
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {mode === 'register' && (
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  className="form-control"
                  name="name"
                  placeholder="Jane Doe"
                  value={form.name}
                  onChange={handleChange}
                  required
                  autoComplete="name"
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                className={`form-control${hasError && mode === 'login' ? ' input-error' : ''}`}
                name="email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className={`form-control${hasError && mode === 'login' ? ' input-error' : ''}`}
                name="password"
                type="password"
                placeholder={mode === 'register' ? 'At least 6 characters' : '••••••••'}
                value={form.password}
                onChange={handleChange}
                required
                minLength={mode === 'register' ? 6 : 1}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%', marginTop: 8 }}
              disabled={loading}
            >
              {loading
                ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                    <span style={{
                      width: 15, height: 15,
                      border: '2px solid rgba(255,255,255,0.35)',
                      borderTopColor: '#fff',
                      borderRadius: '50%',
                      animation: 'spin 0.7s linear infinite',
                      display: 'inline-block',
                      flexShrink: 0,
                    }} />
                    Please wait…
                  </span>
                )
                : mode === 'login' ? 'Sign In' : 'Create Account'
              }
            </button>
          </form>

          <div className="divider" />

          <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              onClick={toggleMode}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--primary)', fontWeight: 600, fontSize: '0.875rem',
              }}
            >
              {mode === 'login' ? 'Sign up free' : 'Sign in instead'}
            </button>
          </p>

          {mode === 'login' && (
            <div style={{
              textAlign: 'center', marginTop: 12, fontSize: '0.75rem',
              color: 'var(--text-muted)', background: 'var(--gray-50)',
              borderRadius: 6, padding: '8px 12px',
              border: '1px solid var(--border)',
            }}>
              Demo admin: <strong>admin@expensetracker.com</strong> / <strong>Admin@123</strong>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
