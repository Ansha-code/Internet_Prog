import React, { useEffect, useState, useCallback } from 'react';
import { useExpenses } from '../hooks/useExpenses';
import { formatCurrency, formatDate, CATEGORY_COLORS, CATEGORY_ICONS, CATEGORIES } from '../utils/constants';
import ExpenseModal from '../components/ExpenseModal';
import ConfirmDialog from '../components/ConfirmDialog';

export default function ExpensesPage({ searchQuery, modalOpen, onModalClose }) {
  const { expenses, loading, fetchExpenses, createExpense, updateExpense, deleteExpense } = useExpenses();

  const [editTarget,   setEditTarget]   = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast,        setToast]        = useState('');
  const [catFilter,    setCatFilter]    = useState('All');
  const [sortBy,       setSortBy]       = useState('expense_date');
  const [sortOrder,    setSortOrder]    = useState('DESC');

  // Fetch whenever sort changes; search is debounced client-side for live feel
  useEffect(() => {
    fetchExpenses({ sortBy, order: sortOrder });
  }, [fetchExpenses, sortBy, sortOrder]);

  // Client-side live filter (instant, no API round-trip for every keystroke)
  const filtered = expenses.filter(e => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q ||
      e.title.toLowerCase().includes(q) ||
      e.category.toLowerCase().includes(q) ||
      (e.description || '').toLowerCase().includes(q) ||
      String(e.amount).includes(q);
    const matchCat = catFilter === 'All' || e.category === catFilter;
    return matchSearch && matchCat;
  });

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }, []);

  const handleSave = async (payload) => {
    let result;
    if (editTarget) {
      result = await updateExpense(editTarget.id, payload);
      if (result.success) { showToast('Expense updated ✓'); setEditTarget(null); onModalClose(); }
    } else {
      result = await createExpense(payload);
      if (result.success) { showToast('Expense added ✓'); onModalClose(); }
    }
    return result;
  };

  const handleDelete = async () => {
    const result = await deleteExpense(deleteTarget.id);
    if (result.success) showToast('Expense deleted');
    setDeleteTarget(null);
  };

  const toggleSort = (col) => {
    if (sortBy === col) setSortOrder(o => o === 'ASC' ? 'DESC' : 'ASC');
    else { setSortBy(col); setSortOrder('DESC'); }
  };

  const SortBtn = ({ col }) => (
    <button
      onClick={() => toggleSort(col)}
      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 'inherit' }}
    >
      {sortBy === col ? (sortOrder === 'ASC' ? '↑' : '↓') : '⇅'}
    </button>
  );

  const totalFiltered = filtered.reduce((s, e) => s + parseFloat(e.amount), 0);

  return (
    <div className="page-content">
      {/* Toast notification */}
      {toast && (
        <div className="alert alert-success" style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, margin: 0, minWidth: 240 }}>
          {toast}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 4 }}>Expense Logbook</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            {filtered.length} record{filtered.length !== 1 ? 's' : ''} · Total: <strong>{formatCurrency(totalFiltered)}</strong>
          </p>
        </div>

        {/* Category filter pills */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: 500 }}>
          {['All', ...CATEGORIES.slice(0, 6)].map(cat => (
            <button
              key={cat}
              className={`btn btn-sm ${catFilter === cat ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setCatFilter(cat)}
              style={{ fontSize: '0.72rem' }}
            >
              {cat === 'All' ? '🗂️ All' : `${CATEGORY_ICONS[cat] || ''} ${cat}`}
            </button>
          ))}
          <select
            className="form-control"
            style={{ width: 'auto', fontSize: '0.72rem', padding: '4px 8px', height: 30 }}
            value={CATEGORIES.slice(6).includes(catFilter) ? catFilter : ''}
            onChange={e => setCatFilter(e.target.value || 'All')}
          >
            <option value="">More…</option>
            {CATEGORIES.slice(6).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading-wrap"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">{searchQuery ? '🔍' : '💸'}</div>
            <h4>{searchQuery ? 'No matching expenses' : 'No expenses yet'}</h4>
            <p>{searchQuery ? 'Try a different search term' : 'Click "+ Add Expense" to get started'}</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Title <SortBtn col="title" /></th>
                  <th>Category</th>
                  <th>Amount <SortBtn col="amount" /></th>
                  <th>Date <SortBtn col="expense_date" /></th>
                  <th>Description</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(exp => (
                  <tr key={exp.id}>
                    <td style={{ fontWeight: 600 }}>{exp.title}</td>
                    <td>
                      <span className="badge" style={{
                        background: `${CATEGORY_COLORS[exp.category]}22`,
                        color: CATEGORY_COLORS[exp.category] || 'var(--text-secondary)',
                        border: `1px solid ${CATEGORY_COLORS[exp.category]}44`,
                      }}>
                        {CATEGORY_ICONS[exp.category]} {exp.category}
                      </span>
                    </td>
                    <td className="text-mono fw-600" style={{ color: 'var(--primary)' }}>
                      {formatCurrency(exp.amount)}
                    </td>
                    <td className="text-muted">{formatDate(exp.expense_date)}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem', maxWidth: 200,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {exp.description || '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button
                          className="btn btn-icon btn-ghost btn-sm"
                          title="Edit"
                          onClick={() => { setEditTarget(exp); }}
                        >✏️</button>
                        <button
                          className="btn btn-icon btn-sm"
                          title="Delete"
                          style={{ background: 'var(--danger-light)', color: 'var(--danger)', border: 'none' }}
                          onClick={() => setDeleteTarget(exp)}
                        >🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit modal */}
      {(modalOpen || editTarget) && (
        <ExpenseModal
          expense={editTarget}
          onSave={handleSave}
          onClose={() => { setEditTarget(null); onModalClose(); }}
        />
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <ConfirmDialog
          title="Delete Expense"
          message={`Are you sure you want to delete "${deleteTarget.title}"? This action cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
