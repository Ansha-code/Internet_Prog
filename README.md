# 💳 PocketGuard: Smart Expense Tracker

> A full-stack single-page application that helps users monitor, categorise, and gain insight into their personal spending habits.

---

## 📌 Problem Statement

Managing personal finances is difficult when expenses are scattered across receipts, bank apps, and memory. **PocketGuard** solves this by providing a single, streamlined platform to log every expense, visualise spending patterns, detect overspending early, and receive personalised money-saving tips — all in real time.

---

## 🧰 Technical Stack

| Layer       | Technology                              | Purpose                                      |
|-------------|----------------------------------------|----------------------------------------------|
| Frontend    | React 18                               | SPA with conditional rendering               |
| Styling     | Vanilla CSS with CSS custom properties | Design token–driven, responsive layout       |
| Charts      | Recharts                               | Bar, Line, Pie, and Donut visualisations     |
| HTTP Client | Axios                                  | JWT-intercepted API calls                    |
| Backend     | Node.js + Express 4                    | REST API, middleware, route handlers         |
| Auth        | bcryptjs + JSON Web Tokens             | Password hashing + stateless auth            |
| Validation  | express-validator                      | Server-side input validation                 |
| Database    | MySQL 8 (via mysql2/promise)           | Relational data, connection pooling          |
| Dev tools   | nodemon, concurrently                  | Hot reload + parallel process management     |

---

## 🗂️ Folder Structure

```
expense-tracker/
│
├── package.json                  # Root scripts
│
├── backend/
│   ├── server.js                 # Express app entry point, middleware, global error handler
│   ├── package.json
│   ├── .env.example              # Copy to .env and fill in your values
│   │
│   ├── config/
│   │   ├── db.js                 # mysql2 connection pool; exits process on failure
│   │   └── schema.sql            # DDL for all 3 tables + seed admin account
│   │
│   ├── middleware/
│   │   ├── auth.js               # authenticate() — verifies JWT; authorize() — RBAC guard
│   │   └── activityLogger.js     # logActivity() — writes to user_activity table
│   │
│   ├── controllers/
│   │   ├── authController.js     # register, login, logout, getProfile, updateProfile, changePassword
│   │   ├── expenseController.js  # CRUD + analytics (summary, categoryTotals, monthlyTrend)
│   │   └── adminController.js    # getAllUsers, updateRole, deleteUser, activityLogs, platformStats
│   │
│   └── routes/
│       ├── auth.js               # /api/auth/*
│       ├── expenses.js           # /api/expenses/* (all protected)
│       └── admin.js              # /api/admin/* (admin-only)
│
└── frontend/
    ├── package.json
    ├── public/
    │   └── index.html            # THE single HTML file — React mounts here
    │
    └── src/
        ├── index.js              # ReactDOM.createRoot, wraps App in AuthProvider
        ├── App.js                # SPA shell: page state, layout, conditional rendering
        ├── index.css             # Global styles, CSS variables, design tokens
        │
        ├── context/
        │   └── AuthContext.js    # useReducer-based global auth state + login/register/logout
        │
        ├── hooks/
        │   └── useExpenses.js    # useReducer-based expense CRUD + analytics fetch helpers
        │
        ├── utils/
        │   ├── api.js            # Axios instance with JWT request interceptor + 401 handler
        │   └── constants.js      # Categories, colour map, icons, budget thresholds, formatters
        │
        ├── components/
        │   ├── Sidebar.js        # Navigation sidebar with role-aware admin link
        │   ├── TopBar.js         # Live date clock, greeting, search bar, Add Expense button
        │   ├── ExpenseModal.js   # Add/Edit expense form (controlled, validated)
        │   └── ConfirmDialog.js  # Reusable delete confirmation modal
        │
        └── pages/
            ├── AuthPage.js       # Login + Register (toggled in-place, no route change)
            ├── Dashboard.js      # Stat cards, bar + pie charts, category table
            ├── ExpensesPage.js   # Logbook table, live search, sort, category filter, CRUD
            ├── AnalyticsPage.js  # Line trend, horizontal bar, donut, monthly table
            ├── SummaryPage.js    # Personalised insights, overspending alerts, saving tips
            ├── ProfilePage.js    # Avatar picker, update name, change password
            └── AdminPage.js      # User management, activity log, platform stats
```


### Login For Testing Purpose
email - john@example.com          password - User@123



## 🔑 API Endpoints

### Auth — `/api/auth`
| Method | Path               | Auth   | Description                  |
|--------|--------------------|--------|------------------------------|
| POST   | `/register`        | No     | Create account               |
| POST   | `/login`           | No     | Login, returns JWT           |
| POST   | `/logout`          | User   | Log logout event             |
| GET    | `/profile`         | User   | Get current user             |
| PUT    | `/profile`         | User   | Update name / avatar         |
| PUT    | `/change-password` | User   | Change password              |

### Expenses — `/api/expenses` (all require JWT)
| Method | Path                          | Description                      |
|--------|-------------------------------|----------------------------------|
| GET    | `/`                           | List expenses (search + filter)  |
| POST   | `/`                           | Create expense                   |
| GET    | `/:id`                        | Get single expense               |
| PUT    | `/:id`                        | Update expense                   |
| DELETE | `/:id`                        | Delete expense                   |
| GET    | `/analytics/summary`          | Current/previous month totals    |
| GET    | `/analytics/categories`       | Totals grouped by category       |
| GET    | `/analytics/monthly`          | Monthly trend (N months)         |

### Admin — `/api/admin` (require JWT + admin role)
| Method | Path               | Description                     |
|--------|--------------------|---------------------------------|
| GET    | `/users`           | All users with spend stats      |
| GET    | `/users/:id`       | Single user                     |
| PUT    | `/users/:id/role`  | Promote / demote user           |
| DELETE | `/users/:id`       | Delete user + all their data    |
| GET    | `/activity`        | Activity log (all users)        |
| GET    | `/stats`           | Platform-wide statistics        |

---

## 🏗️ Technical & Interface Design Rationale


- **`AuthContext`** — Auth state has 4 interdependent fields (`user`, `token`, `loading`, `error`) that must update atomically (e.g. a failed login must set `error` and clear `loading` in one action). `useReducer` makes these transitions explicit and testable.
- **`useExpenses` hook** — Expense state has 6 related fields. Centralising them in a reducer prevents stale-closure bugs that arise when multiple `useState` setters are called in sequence inside async functions.
- **Page/modal state in `App.js`** — These are simple, independent booleans/strings with no derived logic. `useState` is the right tool and keeps the code concise.


The brief specifies a **single-page application** with one `.html` file and no full-page reloads. React Router would add URL management but also complexity (route guards, nested routes, history API). Since no deep-linking or bookmarkable URLs are required, a simple `activePage` string in `App.js` state achieves the same UX with zero routing overhead.

### Live Search

Search filtering is performed **client-side** on the already-fetched expense list. This gives instant, zero-latency feedback as the user types. The `searchQuery` state lives in `App.js` and is passed down to both `TopBar` (input) and `ExpensesPage` (filter). A `.filter()` on the local array runs in <1ms for typical expense counts.

### Security

- **Password hashing** — bcrypt with cost factor 10 (≈100ms hash time, resistant to brute force).
- **JWT** — Stateless tokens signed with `HS256`. Expiry set via `JWT_EXPIRES_IN`. Tokens are stored in `localStorage` 
- **Role-based access control (RBAC)** — The `authorize(...roles)` middleware on every admin route rejects non-admin tokens with 403 before any controller logic runs.
- **SQL injection prevention** — All queries use parameterised placeholders (`?`). `sortBy` and `order` query params are whitelisted against an array before interpolation.
- **Input validation** — `express-validator` enforces constraints on every mutating endpoint; validation errors return 422 before reaching the database.

### Error Handling

- Global Axios interceptor catches 401 responses and fires a `logout` event so users are never stuck on a broken state.
- Global Express error handler catches uncaught exceptions and returns a generic 500 (no stack trace leaks to the client).
- Every API call in the frontend is wrapped in try/catch; errors surface as inline alert components, not blank pages.

---

## 🗃️ Database Entities (3 conceptual entities)

```
users               expense_items             user_activity
──────────          ─────────────────         ─────────────────
id (PK)             id (PK)                   id (PK)
name                user_id (FK → users)      user_id (FK → users)
email (UNIQUE)      title                     action
password (hashed)   category                  detail
role (user/admin)   amount                    ip_address
avatar              expense_date              created_at
created_at          description
updated_at          created_at
                    updated_at
```

CRUD operations:
- **users** — Create (register), Read (profile/admin), Update (profile/role), Delete (admin)
- **expense_items** — Full CRUD by owner user; analytics via GROUP BY queries
- **user_activity** — Create (every action), Read (admin log view); auto-deleted on user cascade

---

## ✨ Features Summary

| Feature                        | Where                          |
|-------------------------------|-------------------------------|
| Registration / Login / Logout  | AuthPage → AuthContext         |
| JWT authentication             | middleware/auth.js             |
| Password hashing (bcrypt)      | authController.js              |
| Add / Edit / Delete expense    | ExpensesPage + ExpenseModal    |
| Live search (real-time filter) | TopBar + ExpensesPage          |
| Category & date filters        | ExpensesPage                   |
| Dashboard stat cards           | Dashboard.js                   |
| Monthly trend line chart       | AnalyticsPage.js               |
| Category pie / bar charts      | Dashboard + AnalyticsPage      |
| Personalised tips + alerts     | SummaryPage.js                 |
| Overspending detection         | SummaryPage → generateInsights |
| Saving opportunity tips        | SummaryPage → generateInsights |
| Live date in top bar           | TopBar.js (setInterval)        |
| Welcome greeting               | TopBar.js                      |
| User profile + avatar picker   | ProfilePage.js                 |
| Admin: manage users            | AdminPage.js                   |
| Admin: activity log            | AdminPage.js                   |
| Admin: platform stats          | AdminPage.js                   |
| Role-based access (RBAC)       | middleware/auth.js             |
| Responsive layout              | index.css media queries        |
