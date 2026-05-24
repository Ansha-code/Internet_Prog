import React, { useEffect, useState } from 'react';
import { useExpenses } from '../hooks/useExpenses';
import { formatCurrency, CATEGORY_COLORS, CATEGORY_ICONS } from '../utils/constants';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';

const RANGE_OPTIONS = [
  { label: '3 months', value: 3 },
  { label: '6 months', value: 6 },
  { label: '12 months', value: 12 },
];

export default function AnalyticsPage() {
  const { categoryTotals, monthlyTrend, fetchCategoryTotals, fetchMonthlyTrend } = useExpenses();
  const [range, setRange] = useState(6);

  useEffect(() => {
    fetchCategoryTotals();
  }, [fetchCategoryTotals]);

  useEffect(() => {
    fetchMonthlyTrend(range);
  }, [fetchMonthlyTrend, range]);

  const maxMonth = monthlyTrend.reduce((m, row) => Math.max(m, row.total), 0);

  return (
    <div className="page-content">
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 4 }}>Analytics</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Visualise your spending patterns over time
        </p>
      </div>

      {/* ── MONTHLY TREND ────────────────────────── */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <h3>Monthly Expenditure Trend</h3>
          <div style={{ display: 'flex', gap: 6 }}>
            {RANGE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                className={`btn btn-sm ${range === opt.value ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setRange(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div className="card-body">
          {monthlyTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyTrend} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-100)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
                <Tooltip formatter={v => [formatCurrency(v), 'Total']} />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#2563eb' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📈</div>
              <h4>No data for this range</h4>
              <p>Add expenses to see your monthly trend</p>
            </div>
          )}
        </div>
      </div>

      {/* ── CATEGORY DEEP-DIVE ───────────────────── */}
      {categoryTotals.length > 0 && (
        <div className="grid-2" style={{ marginBottom: 20 }}>
          {/* Horizontal bar chart */}
          <div className="card">
            <div className="card-header"><h3>Spending by Category</h3></div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={categoryTotals}
                  layout="vertical"
                  margin={{ top: 0, right: 40, left: 10, bottom: 0 }}
                >
                  <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `$${v}`} />
                  <YAxis type="category" dataKey="category" tick={{ fontSize: 10 }} width={130} />
                  <Tooltip formatter={v => formatCurrency(v)} />
                  <Bar dataKey="total" radius={[0,4,4,0]}>
                    {categoryTotals.map(entry => (
                      <Cell
                        key={entry.category}
                        fill={CATEGORY_COLORS[entry.category] || '#94a3b8'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Donut chart */}
          <div className="card">
            <div className="card-header"><h3>Category Share</h3></div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryTotals}
                    dataKey="total"
                    nameKey="category"
                    cx="50%" cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
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
            </div>
          </div>
        </div>
      )}

      {/* ── MONTHLY BREAKDOWN TABLE ──────────────── */}
      {monthlyTrend.length > 0 && (
        <div className="card">
          <div className="card-header"><h3>Month-by-Month Breakdown</h3></div>
          <div className="card-body" style={{ paddingTop: 12 }}>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Transactions</th>
                    <th className="text-right">Total Spent</th>
                    <th>Relative</th>
                  </tr>
                </thead>
                <tbody>
                  {[...monthlyTrend].reverse().map(row => (
                    <tr key={row.month}>
                      <td className="fw-600">{row.month}</td>
                      <td>{row.count}</td>
                      <td className="text-right text-mono fw-600" style={{ color: 'var(--primary)' }}>
                        {formatCurrency(row.total)}
                      </td>
                      <td style={{ width: 160 }}>
                        <div style={{
                          height: 8, borderRadius: 4,
                          background: 'var(--gray-100)',
                          overflow: 'hidden',
                        }}>
                          <div style={{
                            height: '100%',
                            width: `${maxMonth > 0 ? (row.total / maxMonth) * 100 : 0}%`,
                            background: 'var(--primary)',
                            borderRadius: 4,
                          }} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Category stats table */}
      {categoryTotals.length > 0 && (
        <div className="card" style={{ marginTop: 20 }}>
          <div className="card-header"><h3>Category Statistics</h3></div>
          <div className="card-body" style={{ paddingTop: 12 }}>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Transactions</th>
                    <th className="text-right">Total</th>
                    <th className="text-right">Average</th>
                    <th className="text-right">Max Single</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryTotals.map(row => (
                    <tr key={row.category}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span
                            className="cat-dot"
                            style={{ background: CATEGORY_COLORS[row.category] || '#94a3b8' }}
                          />
                          {CATEGORY_ICONS[row.category]} {row.category}
                        </div>
                      </td>
                      <td>{row.count}</td>
                      <td className="text-right text-mono fw-600">{formatCurrency(row.total)}</td>
                      <td className="text-right text-mono text-muted">{formatCurrency(row.average)}</td>
                      <td className="text-right text-mono text-muted">{formatCurrency(row.max_amount)}</td>
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
