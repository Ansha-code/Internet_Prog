import React from 'react';

export default function ConfirmDialog({ title, message, onConfirm, onCancel, danger = true }) {
  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="modal" style={{ maxWidth: 420 }}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="btn btn-icon btn-ghost" onClick={onCancel}>✕</button>
        </div>
        <div className="modal-body">
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{message}</p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>
            {danger ? '🗑️ Delete' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
