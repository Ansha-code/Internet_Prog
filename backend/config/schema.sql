-- Expense Tracker Database Schema


CREATE DATABASE IF NOT EXISTS expense_tracker CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE expense_tracker;

-- ─────────────────────────────────────────────
-- 1. USERS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100)        NOT NULL,
  email       VARCHAR(150) UNIQUE NOT NULL,
  password    VARCHAR(255)        NOT NULL,
  role        ENUM('user','admin') DEFAULT 'user',
  avatar      VARCHAR(10)         DEFAULT NULL,   -- emoji avatar
  created_at  DATETIME            DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME            DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────
-- 2. EXPENSE ITEMS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS expense_items (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT          NOT NULL,
  title       VARCHAR(150) NOT NULL,
  category    VARCHAR(80)  NOT NULL,
  amount      DECIMAL(12,2) NOT NULL,
  expense_date DATE         NOT NULL,
  description TEXT,
  created_at  DATETIME     DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_date (user_id, expense_date),
  INDEX idx_category  (category)
);

-- ─────────────────────────────────────────────
-- 3. USER ACTIVITY LOG
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_activity (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT          NOT NULL,
  action      VARCHAR(100) NOT NULL,   -- e.g. 'login', 'logout', 'create_expense'
  detail      TEXT,                    -- JSON or human-readable detail
  ip_address  VARCHAR(45),
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_activity (user_id, created_at)
);

show tables from expense_tracker;

SELECT * FROM users;
SELECT * FROM expense_items;


USE expense_tracker;

-- ─────────────────────────────────────────────────────────────
-- USERS  
-- ─────────────────────────────────────────────────────────────

-- Admin  →  admin@expensetracker.com / Admin@123
INSERT INTO users (name, email, password, role, avatar) VALUES
('Admin', 'admin@expensetracker.com',
 '$2a$10$XFfgC8vDfvAP8UJj8oDtpORuhesm663e7hfYfgUomFh3X2qQ9nzra',
 'admin', '👑')
ON DUPLICATE KEY UPDATE
  password = '$2a$10$XFfgC8vDfvAP8UJj8oDtpORuhesm663e7hfYfgUomFh3X2qQ9nzra',
  role = 'admin', avatar = '👑';

-- User 1 →  john@example.com / User@123
INSERT INTO users (name, email, password, role, avatar) VALUES
('John Carter', 'john@example.com',
 '$2a$10$nhNPUjv1Jo6auCLg2ROTsuyPZTigNBIgtjlmEw11DjDOqU0rWz20e',
 'user', '😎')
ON DUPLICATE KEY UPDATE password = '$2a$10$nhNPUjv1Jo6auCLg2ROTsuyPZTigNBIgtjlmEw11DjDOqU0rWz20e';

-- User 2 →  jane@example.com / Jane@123
INSERT INTO users (name, email, password, role, avatar) VALUES
('Jane Smith', 'jane@example.com',
 '$2a$10$NxibcbfVp/xCbgARg796k.GImSauqxwNK2xmwmj/.sQ4qLaxloeom',
 'user', '🙂')
ON DUPLICATE KEY UPDATE password = '$2a$10$NxibcbfVp/xCbgARg796k.GImSauqxwNK2xmwmj/.sQ4qLaxloeom';


-- NOTE: The id is 5,6 because I have tried and tested with different users 
-- ─────────────────────────────────────────────────────────────
-- EXPENSES for John Carter (user_id = 5)
-- ─────────────────────────────────────────────────────────────
INSERT INTO expense_items (user_id, title, category, amount, expense_date, description) VALUES
(5, 'Grocery run – Whole Foods',      'Food & Dining',        87.50,  '2026-05-01', 'Weekly groceries'),
(5, 'Netflix subscription',           'Subscriptions',        15.99,  '2026-05-02', 'Monthly streaming'),
(5, 'Uber to airport',                'Transportation',       34.20,  '2026-05-03', 'Work trip'),
(5, 'Dinner at Olive Garden',         'Food & Dining',        62.00,  '2026-05-05', 'Date night'),
(5, 'Electric bill',                  'Housing & Utilities',  110.00, '2026-05-06', 'May electricity'),
(5, 'Amazon – office chair',          'Shopping',             249.99, '2026-05-07', 'WFH setup upgrade'),
(5, 'Gym membership',                 'Personal Care',        45.00,  '2026-05-08', 'Monthly gym fee'),
(5, 'Spotify Premium',                'Subscriptions',        9.99,   '2026-05-09', 'Music streaming'),
(5, 'Doctor visit co-pay',            'Healthcare',           30.00,  '2026-05-10', 'Annual check-up'),
(5, 'Coffee shop – daily',            'Food & Dining',        22.75,  '2026-05-11', 'Remote work session'),
(5, 'Bus pass – monthly',             'Transportation',       55.00,  '2026-05-12', 'Public transit'),
(5, 'Online course – Udemy',          'Education',            19.99,  '2026-05-13', 'React advanced course'),
(5, 'Internet bill',                  'Housing & Utilities',  65.00,  '2026-05-14', 'Monthly ISP'),
(5, 'Movie tickets x2',               'Entertainment',        28.00,  '2026-05-15', 'Weekend outing'),
(5, 'Pharmacy – vitamins',            'Healthcare',           18.50,  '2026-05-16', 'Supplements'),
(5, 'Takeout – Thai food',            'Food & Dining',        38.90,  '2026-05-17', 'Friday dinner'),
(5, 'Savings transfer',               'Investments & Savings',200.00, '2026-05-18', 'Monthly savings goal'),
(5, 'Haircut',                        'Personal Care',        35.00,  '2026-05-19', 'Barber'),
(5, 'Gas refill',                     'Transportation',       48.60,  '2026-05-20', 'Full tank'),
(5, 'Groceries – Trader Joes',        'Food & Dining',        74.30,  '2026-05-21', 'Weekly shop'),
-- April data for trend chart
(5, 'Rent – April',                   'Housing & Utilities',  1200.00,'2026-04-01', 'Monthly rent'),
(5, 'Groceries – April wk1',          'Food & Dining',        91.20,  '2026-04-05', 'Weekly groceries'),
(5, 'Gym membership – April',         'Personal Care',        45.00,  '2026-04-08', 'Monthly gym fee'),
(5, 'Electricity – April',            'Housing & Utilities',  98.00,  '2026-04-10', 'April electricity'),
(5, 'Dinner out',                     'Food & Dining',        55.40,  '2026-04-14', 'Friend birthday dinner'),
(5, 'Uber rides',                     'Transportation',       42.00,  '2026-04-18', 'Various trips'),
(5, 'Amazon purchases',               'Shopping',             134.00, '2026-04-22', 'Household items'),
(5, 'Streaming services',             'Subscriptions',        35.97,  '2026-04-25', 'Netflix + Spotify + Disney'),
-- March data
(5, 'Rent – March',                   'Housing & Utilities',  1200.00,'2026-03-01', 'Monthly rent'),
(5, 'Groceries – March',              'Food & Dining',        310.00, '2026-03-15', 'Monthly groceries total'),
(5, 'Transport – March',              'Transportation',       120.00, '2026-03-20', 'Bus + Uber combined'),
(5, 'Entertainment – March',          'Entertainment',        89.00,  '2026-03-25', 'Concerts + movies');


-- ─────────────────────────────────────────────────────────────
-- EXPENSES for Jane Smith (user_id = 6)
-- ─────────────────────────────────────────────────────────────
INSERT INTO expense_items (user_id, title, category, amount, expense_date, description) VALUES
(6, 'Weekly groceries – Safeway',     'Food & Dining',        95.60,  '2026-05-01', 'Main weekly shop'),
(6, 'Yoga class – monthly pass',      'Personal Care',        80.00,  '2026-05-02', 'Studio membership'),
(6, 'Flight – weekend trip',          'Travel',               320.00, '2026-05-03', 'Round trip to NYC'),
(6, 'Hotel – 2 nights',               'Travel',               210.00, '2026-05-04', 'NYC accommodation'),
(6, 'Adobe Creative Cloud',           'Subscriptions',        54.99,  '2026-05-05', 'Design tools'),
(6, 'Dinner – fine dining',           'Food & Dining',        120.00, '2026-05-06', 'Anniversary dinner'),
(6, 'Water + gas bill',               'Housing & Utilities',  85.00,  '2026-05-07', 'Combined utilities'),
(6, 'New running shoes',              'Shopping',             139.99, '2026-05-08', 'Nike Air Zoom'),
(6, 'Prescription refill',            'Healthcare',           25.00,  '2026-05-09', 'Monthly medication'),
(6, 'Lunch – team outing',            'Food & Dining',        45.00,  '2026-05-10', 'Work team lunch'),
(6, 'Taxi rides',                     'Transportation',       62.50,  '2026-05-11', 'Various trips this week'),
(6, 'Book – Clean Code',              'Education',            34.99,  '2026-05-12', 'Professional development'),
(6, 'Concert tickets',                'Entertainment',        95.00,  '2026-05-13', 'Jazz festival x2'),
(6, 'Skincare products',              'Personal Care',        67.50,  '2026-05-14', 'Monthly restock'),
(6, 'Investment – index fund',        'Investments & Savings',500.00, '2026-05-15', 'Monthly DCA investment'),
(6, 'Coffee + snacks',                'Food & Dining',        31.20,  '2026-05-16', 'Café working session'),
(6, 'Phone bill',                     'Housing & Utilities',  55.00,  '2026-05-17', 'Monthly mobile plan'),
(6, 'Parking fees',                   'Transportation',       24.00,  '2026-05-18', 'Weekly parking'),
(6, 'Groceries – mid-week top up',    'Food & Dining',        42.80,  '2026-05-19', 'Fresh produce'),
(6, 'Massage – self care',            'Personal Care',        90.00,  '2026-05-20', 'Monthly treat'),
-- April data
(6, 'Rent – April',                   'Housing & Utilities',  1350.00,'2026-04-01', 'Monthly rent'),
(6, 'Groceries – April',              'Food & Dining',        380.00, '2026-04-10', 'Monthly food total'),
(6, 'Travel – weekend getaway',       'Travel',               450.00, '2026-04-15', 'Boston trip'),
(6, 'Shopping – clothes',             'Shopping',             220.00, '2026-04-20', 'Spring wardrobe'),
(6, 'Entertainment – April',          'Entertainment',        110.00, '2026-04-25', 'Movies + events'),
-- March data
(6, 'Rent – March',                   'Housing & Utilities',  1350.00,'2026-03-01', 'Monthly rent'),
(6, 'Groceries – March',              'Food & Dining',        350.00, '2026-03-12', 'Monthly groceries'),
(6, 'Travel – March',                 'Travel',               280.00, '2026-03-18', 'Day trips'),
(6, 'Subscriptions – March',          'Subscriptions',        120.00, '2026-03-28', 'All subscriptions');
