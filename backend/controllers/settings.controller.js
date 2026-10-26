/**
 * Settings Controller
 * Handles account settings, password changes, and secure account deactivation.
 */
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

async function changePassword(req, res, next) {
  const userId = req.session.userId;
  const { current_password, new_password, confirm_password } = req.body;

  if (!current_password || !new_password) {
    return res.status(400).json({
      success: false,
      message: 'Both current password and new password are required.'
    });
  }

  if (new_password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'New password must be at least 6 characters long.'
    });
  }

  if (confirm_password && new_password !== confirm_password) {
    return res.status(400).json({
      success: false,
      message: 'New password and confirmation password do not match.'
    });
  }

  try {
    const [rows] = await pool.query(
      'SELECT password_hash FROM users WHERE id = ?',
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.'
      });
    }

    const isMatch = await bcrypt.compare(current_password, rows[0].password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'The current password you entered is incorrect.'
      });
    }

    const saltRounds = 10;
    const newHash = await bcrypt.hash(new_password, saltRounds);

    await pool.query(
      'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newHash, userId]
    );

    res.status(200).json({
      success: true,
      message: 'Password updated successfully.'
    });
  } catch (error) {
    next(error);
  }
}

async function getAccountDetails(req, res, next) {
  const userId = req.session.userId;

  try {
    const [rows] = await pool.query(
      'SELECT id, full_name, email, account_status, created_at FROM users WHERE id = ?',
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.status(200).json({
      success: true,
      account: rows[0]
    });
  } catch (error) {
    next(error);
  }
}

async function deactivateAccount(req, res, next) {
  const userId = req.session.userId;
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({
      success: false,
      message: 'Password confirmation is required to deactivate account.'
    });
  }

  try {
    const [rows] = await pool.query('SELECT password_hash FROM users WHERE id = ?', [userId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const isMatch = await bcrypt.compare(password, rows[0].password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password.'
      });
    }

    await pool.query(
      'UPDATE users SET account_status = "inactive", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [userId]
    );

    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.status(200).json({
        success: true,
        message: 'Your account has been deactivated.'
      });
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  changePassword,
  getAccountDetails,
  deactivateAccount
};
