export const CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Housing & Utilities',
  'Healthcare',
  'Entertainment',
  'Shopping',
  'Education',
  'Travel',
  'Personal Care',
  'Investments & Savings',
  'Subscriptions',
  'Other',
];

/** Bright, distinct colours for charts — one per category */
export const CATEGORY_COLORS = {
  'Food & Dining':        '#f97316',
  'Transportation':       '#3b82f6',
  'Housing & Utilities':  '#8b5cf6',
  'Healthcare':           '#ef4444',
  'Entertainment':        '#ec4899',
  'Shopping':             '#14b8a6',
  'Education':            '#f59e0b',
  'Travel':               '#06b6d4',
  'Personal Care':        '#84cc16',
  'Investments & Savings':'#10b981',
  'Subscriptions':        '#6366f1',
  'Other':                '#94a3b8',
};

export const CATEGORY_ICONS = {
  'Food & Dining':        '🍽️',
  'Transportation':       '🚗',
  'Housing & Utilities':  '🏠',
  'Healthcare':           '🏥',
  'Entertainment':        '🎬',
  'Shopping':             '🛍️',
  'Education':            '📚',
  'Travel':               '✈️',
  'Personal Care':        '💆',
  'Investments & Savings':'💰',
  'Subscriptions':        '📱',
  'Other':                '📦',
};

/** Budget thresholds (monthly) for the Summary View */
export const BUDGET_TIPS = {
  'Food & Dining':       { limit: 500,  tip: 'Try meal prepping 2–3 days a week to cut food costs by up to 30%.' },
  'Transportation':      { limit: 300,  tip: 'Consider public transport or carpooling to reduce fuel costs.' },
  'Housing & Utilities': { limit: 1500, tip: 'Smart plugs and LED bulbs can cut utility bills significantly.' },
  'Healthcare':          { limit: 200,  tip: 'Preventive check-ups are cheaper than reactive treatments.' },
  'Entertainment':       { limit: 150,  tip: 'Look for free local events or share streaming subscriptions.' },
  'Shopping':            { limit: 300,  tip: 'Implement a 48-hour rule before non-essential purchases.' },
  'Education':           { limit: 200,  tip: 'Many libraries offer free online courses and digital resources.' },
  'Travel':              { limit: 400,  tip: 'Book flights 6–8 weeks in advance for the best prices.' },
  'Personal Care':       { limit: 100,  tip: 'DIY routines for hair and skincare can save hundreds per year.' },
  'Subscriptions':       { limit: 100,  tip: 'Audit subscriptions monthly — unused ones add up fast.' },
};

export const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

export const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
