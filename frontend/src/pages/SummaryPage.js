import React, { useEffect } from 'react';
import { useExpenses } from '../hooks/useExpenses';
import { formatCurrency, CATEGORY_COLORS, CATEGORY_ICONS, BUDGET_TIPS } from '../utils/constants';

const formatMonthLabel = (ym) => {
  if (!ym) return 'Latest Month';
  const [year, month] = ym.split('-');
  const monthName = new Date(year, parseInt(month) - 1, 1)
    .toLocaleString('default', { month: 'long' });
  return `${monthName} ${year}`;
};

function generateInsights(summary, categoryTotals) {
  const insights = [];
  if (!summary || categoryTotals.length === 0) return insights;

  const monthTotal = parseFloat(summary.currentMonth.total);
  const prevTotal  = parseFloat(summary.previousMonth.total);

  // Month-over-month change
  if (prevTotal > 0) {
    const diff = monthTotal - prevTotal;
    const pct  = ((diff / prevTotal) * 100).toFixed(1);
    if (diff > 0) {
      insights.push({
        type: 'overspend',
        title: '📈 Spending Increased',
        body: `You spent ${formatCurrency(diff)} more than the previous month (+${pct}%). Review your biggest categories below to find savings.`,
      });
    } else {
      insights.push({
        type: 'habit',
        title: '🎉 Great Progress!',
        body: `You spent ${formatCurrency(Math.abs(diff))} less than the previous month (${pct}%). Keep up the good habits!`,
      });
    }
  }

  // Category overspending vs budget thresholds
  categoryTotals.forEach(cat => {
    const budget = BUDGET_TIPS[cat.category];
    if (budget && parseFloat(cat.total) > budget.limit) {
      const over = parseFloat(cat.total) - budget.limit;
      insights.push({
        type: 'overspend',
        title: `⚠️ Over Budget: ${cat.category}`,
        body: `You're ${formatCurrency(over)} over a typical monthly budget for this category. ${budget.tip}`,
      });
    }
  });

  // Saving opportunities (well under budget)
  categoryTotals.forEach(cat => {
    const budget = BUDGET_TIPS[cat.category];
    if (budget && parseFloat(cat.total) <= budget.limit * 0.5) {
      const saved = budget.limit - parseFloat(cat.total);
      insights.push({
        type: 'saving',
        title: `💰 Saving Opportunity: ${cat.category}`,
        body: `You've kept ${cat.category} at just ${formatCurrency(cat.total)} — well within limits. Consider saving the remaining ${formatCurrency(saved)}.`,
      });
    }
  });

  // Mindful spending: few transactions
  if (summary.currentMonth.count <= 5 && monthTotal > 0) {
    insights.push({
      type: 'habit',
      title: '✅ Mindful Spending',
      body: `Only ${summary.currentMonth.count} transaction${summary.currentMonth.count !== 1 ? 's' : ''} this period. Fewer, intentional purchases are a sign of financial discipline.`,
    });
  }

  if (insights.length === 0) {
    insights.push({
      type: 'neutral',
      title: '💡 Getting Started',
      body: 'Add a few expenses to start seeing personalised tips, overspending alerts, and saving opportunities.',
    });
  }

  return insights;
}

export default function SummaryPage() {
  const {
    summary, categoryTotals, monthlyTrend,
    fetchSummary, fetchCategoryTotals, fetchMonthlyTrend,
  } = useExpenses();

  useEffect(() => {
    fetchSummary();
    fetchCategoryTotals();
    fetchMonthlyTrend(3);
  }, [fetchSummary, fetchCategoryTotals, fetchMonthlyTrend]);

  const insights   = generateInsights(summary, categoryTotals);
  const ranked     = [...categoryTotals].sort((a, b) => b.total - a.total);
  const monthLabel = formatMonthLabel(summary?.latestMonth);

  return (
    <div className="page-content">
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 4 }}>Summary View</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Personalised financial insights · <strong>{monthLabel}</strong>
        </p>
      </div>

      {/* ── HEADLINE NUMBERS ─────────────────────── */}
      <div className="stat-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-icon blue">📅</div>
          <div className="stat-info">
            <div className="stat-label">{monthLabel}</div>
            <div className="stat-value">{summary ? formatCurrency(summary.currentMonth.total) : '—'}</div>
            <div className="stat-sub">{summary?.currentMonth.count ?? 0} transactions</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon amber">⏮️</div>
          <div className="stat-info">
            <div className="stat-label">Previous Month</div>
            <div className="stat-value">{summary ? formatCurrency(summary.previousMonth.total) : '—'}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">🏆</div>
          <div className="stat-info">
            <div className="stat-label">Top Spend</div>
            <div className="stat-value" style={{ fontSize: '1rem' }}>
              {summary?.topCategory
                ? `${CATEGORY_ICONS[summary.topCategory.category] || ''} ${summary.topCategory.category}`
                : '—'}
            </div>
            {summary?.topCategory && (
              <div className="stat-sub">{formatCurrency(summary.topCategory.total)}</div>
            )}
          </div>
        </div>
      </div>

      {/* ── PERSONALISED INSIGHTS ────────────────── */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header"><h3>💡 Personalised Insights</h3></div>
        <div className="card-body">
          {insights.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔮</div>
              <h4>No insights yet</h4>
              <p>Keep logging expenses — insights appear once you have spending data.</p>
            </div>
          ) : (
            <div className="tips-grid">
              {insights.map((tip, i) => (
                <div key={i} className={`tip-card ${tip.type}`}>
                  <h4>{tip.title}</h4>
                  <p>{tip.body}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── SPENDING RANK ────────────────────────── */}
      {ranked.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header"><h3>📊 Spending Rank by Category (All Time)</h3></div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {ranked.map((cat, i) => {
                const pct   = ranked[0].total > 0
                  ? (parseFloat(cat.total) / parseFloat(ranked[0].total)) * 100
                  : 0;
                const color = CATEGORY_COLORS[cat.category] || '#94a3b8';
                return (
                  <div key={cat.category}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                        #{i + 1} {CATEGORY_ICONS[cat.category]} {cat.category}
                      </span>
                      <span className="text-mono" style={{ fontWeight: 600, color }}>
                        {formatCurrency(cat.total)}
                      </span>
                    </div>
                    <div style={{ height: 8, borderRadius: 4, background: 'var(--gray-100)' }}>
                      <div style={{
                        height: '100%', width: `${pct}%`,
                        background: color, borderRadius: 4,
                        transition: 'width 0.6s ease',
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── UNIVERSAL TIPS ───────────────────────── */}
      <div className="card">
        <div className="card-header"><h3>🌱 Universal Money Habits</h3></div>
        <div className="card-body">
          <div className="tips-grid">
            {[
              { title: '50/30/20 Rule',       body: 'Allocate 50% to needs, 30% to wants, and 20% to savings and debt repayment.' },
              { title: 'Pay Yourself First',  body: 'Transfer savings to a separate account on payday before spending anything. Automate it.' },
              { title: 'Track Every Purchase',body: 'Even small amounts add up. Logging all expenses builds awareness and reduces impulse spending.' },
              { title: 'Review Weekly',       body: 'Spend 5 minutes each week reviewing your expenses. Early detection prevents overspending spirals.' },
            ].map(tip => (
              <div key={tip.title} className="tip-card habit">
                <h4>{tip.title}</h4>
                <p>{tip.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
