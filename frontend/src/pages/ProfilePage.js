import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const AVATARS = ['😊','🙂','😎','🤓','🧑','💼','🦸','🎯','🚀','🌟','🦊','🐼'];

export default function ProfilePage() {
  const { user, updateUser } = useAuth();

  const [profile, setProfile]   = useState({ name: user?.name || '', avatar: user?.avatar || '😊' });
  const [pwForm,  setPwForm]    = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [msg,     setMsg]       = useState({ profile: '', pw: '' });
  const [err,     setErr]       = useState({ profile: '', pw: '' });
  const [saving,  setSaving]    = useState({ profile: false, pw: false });

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!profile.name.trim()) return setErr(p => ({ ...p, profile: 'Name cannot be empty.' }));
    setSaving(p => ({ ...p, profile: true }));
    setErr(p => ({ ...p, profile: '' }));
    try {
      await api.put('/auth/profile', profile);
      updateUser(profile);
      setMsg(p => ({ ...p, profile: 'Profile updated successfully!' }));
      setTimeout(() => setMsg(p => ({ ...p, profile: '' })), 3000);
    } catch (e) {
      setErr(p => ({ ...p, profile: e.response?.data?.message || 'Update failed' }));
    }
    setSaving(p => ({ ...p, profile: false }));
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirm) {
      return setErr(p => ({ ...p, pw: 'Passwords do not match.' }));
    }
    if (pwForm.newPassword.length < 6) {
      return setErr(p => ({ ...p, pw: 'New password must be at least 6 characters.' }));
    }
    setSaving(p => ({ ...p, pw: true }));
    setErr(p => ({ ...p, pw: '' }));
    try {
      await api.put('/auth/change-password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      setMsg(p => ({ ...p, pw: 'Password changed successfully!' }));
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
      setTimeout(() => setMsg(p => ({ ...p, pw: '' })), 3000);
    } catch (e) {
      setErr(p => ({ ...p, pw: e.response?.data?.message || 'Password change failed' }));
    }
    setSaving(p => ({ ...p, pw: false }));
  };

  return (
    <div className="page-content">
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 4 }}>My Profile</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Manage your account settings</p>
      </div>

      {/* Profile card */}
      <div className="card" style={{ maxWidth: 580, marginBottom: 20 }}>
        <div className="card-header"><h3>Account Details</h3></div>
        <div className="card-body">
          {err.profile  && <div className="alert alert-error">{err.profile}</div>}
          {msg.profile  && <div className="alert alert-success">{msg.profile}</div>}

          {/* Avatar picker */}
          <div className="form-group">
            <label className="form-label">Choose Avatar</label>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {AVATARS.map(av => (
                <button
                  key={av}
                  type="button"
                  onClick={() => setProfile(p => ({ ...p, avatar: av }))}
                  style={{
                    fontSize: '1.6rem', padding: '6px 10px', borderRadius: 8, cursor: 'pointer',
                    border: `2px solid ${profile.avatar === av ? 'var(--primary)' : 'var(--border)'}`,
                    background: profile.avatar === av ? 'var(--blue-50)' : 'transparent',
                    transition: 'all 0.15s',
                  }}
                >
                  {av}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleProfileSave}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                className="form-control"
                value={profile.name}
                onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                className="form-control"
                value={user?.email}
                disabled
                style={{ background: 'var(--gray-50)', color: 'var(--text-muted)' }}
              />
              <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                Email cannot be changed
              </small>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Role</label>
              <input
                className="form-control"
                value={user?.role}
                disabled
                style={{ background: 'var(--gray-50)', color: 'var(--text-muted)', textTransform: 'capitalize' }}
              />
            </div>

            <div style={{ marginTop: 20 }}>
              <button type="submit" className="btn btn-primary" disabled={saving.profile}>
                {saving.profile ? 'Saving…' : 'Save Profile'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Change password card */}
      <div className="card" style={{ maxWidth: 580 }}>
        <div className="card-header"><h3>Change Password</h3></div>
        <div className="card-body">
          {err.pw && <div className="alert alert-error">{err.pw}</div>}
          {msg.pw && <div className="alert alert-success">{msg.pw}</div>}

          <form onSubmit={handlePasswordSave}>
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input
                className="form-control"
                type="password"
                value={pwForm.currentPassword}
                onChange={e => setPwForm(p => ({ ...p, currentPassword: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input
                className="form-control"
                type="password"
                placeholder="At least 6 characters"
                value={pwForm.newPassword}
                onChange={e => setPwForm(p => ({ ...p, newPassword: e.target.value }))}
                minLength={6}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input
                className="form-control"
                type="password"
                value={pwForm.confirm}
                onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving.pw}>
              {saving.pw ? 'Changing…' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
