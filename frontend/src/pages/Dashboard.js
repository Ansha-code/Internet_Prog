import React, { useEffect } from 'react';
import { useExpenses } from '../hooks/useExpenses';
import { formatCurrency, CATEGORY_COLORS, CATEGORY_ICONS } from '../utils/constants';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

// Format "2025-05" → "May 2025"
const formatMonthLabel = (ym) => {
  if (!ym) return 'Latest Month';
  const [year, month] = ym.split('-');
  const monthName = new Date(year, parseInt(month) - 1, 1)
    .toLocaleString('default', { month: 'long' });
  return `${monthName} ${year}`;
};

export default function Dashboard({ onNavigate }) {
  const {
    summary, categoryTotals, monthlyTrend,
    fetchSummary, fetchCategoryTotals, fetchMonthlyTrend,
  } = useExpenses();

  useEffect(() => {
    fetchSummary();
    fetchCategoryTotals();
    fetchMonthlyTrend(6);
  }, [fetchSummary, fetchCategoryTotals, fetchMonthlyTrend]);

  const delta     = summary ? summary.currentMonth.total - summary.previousMonth.total : 0;
  const deltaSign = delta > 0 ? 'up' : 'down';
  const monthLabel = summary?.latestMonth
    ? formatMonthLabel(summary.latestMonth)
    : 'Latest Month';

  return (
    <div className="page-content">
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 4 }}>Dashboard</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Financial overview · <strong>{monthLabel}</strong>
        </p>
      </div>

      {/* ── STAT CARDS ─────────────────────────── */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon blue">💸</div>
          <div className="stat-info">
            <div className="stat-label">{monthLabel}</div>
            <div className="stat-value">
              {summary ? formatCurrency(summary.currentMonth.total) : '—'}
            </div>
            {summary && parseFloat(summary.previousMonth.total) > 0 && (
              <div className={`stat-delta ${deltaSign}`}>
                {delta > 0 ? '▲' : '▼'} {formatCurrency(Math.abs(delta))} vs prev month
              </div>
            )}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">📋</div>
          <div className="stat-info">
            <div className="stat-label">Transactions</div>
            <div className="stat-value">{summary?.currentMonth.count ?? '—'}</div>
            <div className="stat-sub">{monthLabel}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon amber">🏆</div>
          <div className="stat-info">
            <div className="stat-label">Top Category</div>
            <div className="stat-value" style={{ fontSize: '1.1rem' }}>
              {summary?.topCategory
                ? `${CATEGORY_ICONS[summary.topCategory.category] || '📦'} ${summary.topCategory.category}`
                : '—'}
            </div>
            {summary?.topCategory && (
              <div className="stat-sub">{formatCurrency(summary.topCategory.total)}</div>
            )}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon blue">💼</div>
          <div className="stat-info">
            <div className="stat-label">All-Time Total</div>
            <div className="stat-value">
              {summary ? formatCurrency(summary.allTime.total) : '—'}
            </div>
            <div className="stat-sub">Since account creation</div>
          </div>
        </div>
      </div>

      {/* ── CHARTS ROW ─────────────────────────── */}
      <div className="grid-2" style={{ marginBottom: 20 }}>
        {/* Monthly spend bar chart */}
        <div className="card">
          <div className="card-header">
            <h3>Monthly Spending (6 months)</h3>
          </div>
          <div className="card-body">
            {monthlyTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={monthlyTrend} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
                  <Tooltip formatter={v => formatCurrency(v)} />
                  <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">📊</div>
                <h4>No data yet</h4>
                <p>Add some expenses to see your trend</p>
              </div>
            )}
          </div>
        </div>

        {/* Category pie chart */}
        <div className="card">
          <div className="card-header">
            <h3>Spending by Category</h3>
          </div>
          <div className="card-body">
            {categoryTotals.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryTotals}
                    dataKey="total"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    
                  >
                    {categoryTotals.map(entry => (
                      <Cell
                        key={entry.category}
                        fill={CATEGORY_COLORS[entry.category] || '#94a3b8'}
                      />
                    ))}
                  </Pie>
                  <Legend formatter={value => <span style={{ fontSize: 11 }}>{value}</span>} />
                  <Tooltip formatter={v => formatCurrency(v)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">🥧</div>
                <h4>No data yet</h4>
                <p>Add expenses to see category breakdown</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── CATEGORY TABLE ──────────────────────── */}
      {categoryTotals.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3>Category Breakdown</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('analytics')}>
              Full analytics →
            </button>
          </div>
          <div className="card-body" style={{ paddingTop: 12 }}>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Transactions</th>
                    <th className="text-right">Total</th>
                    <th className="text-right">Average</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryTotals.slice(0, 8).map(row => (
                    <tr key={row.category}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span
                            className="cat-dot"
                            style={{ background: CATEGORY_COLORS[row.category] || '#94a3b8' }}
                          />
                          <span>{CATEGORY_ICONS[row.category]} {row.category}</span>
                        </div>
                      </td>
                      <td>{row.count}</td>
                      <td className="text-right text-mono fw-600">{formatCurrency(row.total)}</td>
                      <td className="text-right text-mono text-muted">{formatCurrency(row.average)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
