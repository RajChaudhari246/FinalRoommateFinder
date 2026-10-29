/**
 * Authentication & Authorization Middleware
 * Ensures user is authenticated via server-side session and enforces role permissions.
 */
const { pool } = require('../config/database');

function requireAuth(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  }
  return res.status(401).json({
    success: false,
    message: 'Authentication required. Please log in to continue.'
  });
}

async function requireAdmin(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please log in to continue.'
    });
  }

  // Fast path: session already has role
  if (req.session.userRole === 'admin') {
    return next();
  }

  // Fallback check against database for active sessions created prior to role migration
  try {
    const [rows] = await pool.query('SELECT role, account_status FROM users WHERE id = ?', [req.session.userId]);
    if (rows.length > 0 && rows[0].account_status === 'active' && rows[0].role === 'admin') {
      req.session.userRole = 'admin';
      return next();
    }
  } catch (err) {
    console.error('[requireAdmin Auth Error]:', err.message);
  }

  return res.status(403).json({
    success: false,
    message: 'Access denied: System Administrator privileges are required.'
  });
}

module.exports = {
  requireAuth,
  requireAdmin
};
