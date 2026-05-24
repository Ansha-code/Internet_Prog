const pool = require('../config/db');

/**
 * Logs a user action to the user_activity table.
 * @param {number} userId
 * @param {string} action  - Short action label, e.g. 'create_expense'
 * @param {string} detail  - Human-readable or JSON detail
 * @param {string} ip      - IP address of the requester
 */
const logActivity = async (userId, action, detail = '', ip = '') => {
  try {
    await pool.query(
      'INSERT INTO user_activity (user_id, action, detail, ip_address) VALUES (?, ?, ?, ?)',
      [userId, action, detail, ip]
    );
  } catch (err) {
    // Activity logging should never break primary flows
    console.error('Activity log error:', err.message);
  }
};

module.exports = { logActivity };
