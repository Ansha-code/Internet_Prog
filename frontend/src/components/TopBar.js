import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const DAYS    = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTHS  = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function TopBar({ onAddExpense, searchValue, onSearchChange, showSearch }) {
  const { user } = useAuth();
  const [now, setNow] = useState(new Date());

  // Update clock every minute
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const day   = DAYS[now.getDay()];
  const date  = now.getDate();
  const month = MONTHS[now.getMonth()];
  const year  = now.getFullYear();

  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="topbar-greeting">
          <h3>{greeting}, {user?.name?.split(' ')[0]} {user?.avatar}</h3>
          <p>Here's your financial overview</p>
        </div>
      </div>

      <div className="topbar-right">
        {/* Live search — rendered only on the Expenses page */}
        {showSearch && (
          <div className="search-bar" style={{ width: 260 }}>
            <span className="search-icon">🔍</span>
            <input
              className="form-control"
              placeholder="Search expenses…"
              value={searchValue}
              onChange={e => onSearchChange(e.target.value)}
              style={{ paddingLeft: 40 }}
            />
          </div>
        )}

        {/* Live date chip */}
        <div className="topbar-date">
          <span>📅</span>
          <span>{day}, {month} {date}, {year}</span>
        </div>

        {/* Quick-add button */}
        {onAddExpense && (
          <button className="btn btn-primary btn-sm" onClick={onAddExpense}>
            + Add Expense
          </button>
        )}
      </div>
    </header>
  );
}
