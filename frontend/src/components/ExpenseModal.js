import React, { useState, useEffect } from 'react';
import { CATEGORIES } from '../utils/constants';

const today = () => new Date().toISOString().split('T')[0];

const empty = {
  title: '', category: CATEGORIES[0], amount: '',
  expense_date: today(), description: '',
};

export default function ExpenseModal({ expense, onSave, onClose }) {
  const isEdit = Boolean(expense);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Pre-fill form when editing
  useEffect(() => {
    if (expense) {
      setForm({
        title:        expense.title,
        category:     expense.category,
        amount:       expense.amount,
        expense_date: expense.expense_date?.split('T')[0] || today(),
        description:  expense.description || '',
      });
    }
  }, [expense]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.title.trim())           return setError('Title is required.');
    if (!form.amount || parseFloat(form.amount) <= 0) return setError('Amount must be greater than 0.');
    if (!form.expense_date)           return setError('Date is required.');

    setSaving(true);
    const payload = { ...form, amount: parseFloat(form.amount) };
    const result = await onSave(payload);
    setSaving(false);

    if (!result.success) setError(result.message);
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-header">
          <h3>{isEdit ? '✏️ Edit Expense' : '➕ Add New Expense'}</h3>
          <button className="btn btn-icon btn-ghost" onClick={onClose} title="Close">✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="alert alert-error">{error}</div>}

            <div className="form-group">
              <label className="form-label">Title *</label>
              <input
                className="form-control"
                name="title"
                placeholder="e.g. Grocery run at Whole Foods"
                value={form.title}
                onChange={handleChange}
                maxLength={150}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group mb-0">
                <label className="form-label">Category *</label>
                <select className="form-control" name="category" value={form.category} onChange={handleChange}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="form-group mb-0">
                <label className="form-label">Amount (USD) *</label>
                <input
                  className="form-control text-mono"
                  name="amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: 18 }}>
              <label className="form-label">Date *</label>
              <input
                className="form-control"
                name="expense_date"
                type="date"
                value={form.expense_date}
                onChange={handleChange}
                max={today()}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-control"
                name="description"
                placeholder="Optional notes about this expense…"
                value={form.description}
                onChange={handleChange}
                rows={3}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
