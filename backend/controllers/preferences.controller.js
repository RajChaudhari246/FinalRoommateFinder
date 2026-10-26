/**
 * Roommate Preferences Controller
 * Manages desired roommate criteria for matching
 */
const { pool } = require('../config/database');

async function getMyPreferences(req, res, next) {
  const userId = req.session.userId;

  try {
    const [rows] = await pool.query(
      'SELECT * FROM preferences WHERE user_id = ?',
      [userId]
    );

    if (rows.length === 0) {
      // Create default if not present
      await pool.query('INSERT IGNORE INTO preferences (user_id) VALUES (?)', [userId]);
      const [newRows] = await pool.query('SELECT * FROM preferences WHERE user_id = ?', [userId]);
      return res.status(200).json({
        success: true,
        preferences: newRows[0] || {}
      });
    }

    res.status(200).json({
      success: true,
      preferences: rows[0]
    });
  } catch (error) {
    next(error);
  }
}

async function updateMyPreferences(req, res, next) {
  const userId = req.session.userId;
  const {
    preferred_location,
    min_budget,
    max_budget,
    preferred_food,
    preferred_smoking_status,
    preferred_study_schedule,
    preferred_sleeping_schedule,
    preferred_cleanliness,
    preferred_roommate_count
  } = req.body;

  try {
    const parsedMin = min_budget !== null && min_budget !== undefined && min_budget !== ''
      ? parseFloat(min_budget) : null;
    const parsedMax = max_budget !== null && max_budget !== undefined && max_budget !== ''
      ? parseFloat(max_budget) : null;
    const parsedCount = preferred_roommate_count ? parseInt(preferred_roommate_count, 10) : 1;

    const [existingPref] = await pool.query('SELECT id FROM preferences WHERE user_id = ?', [userId]);

    if (existingPref && existingPref.length > 0) {
      await pool.query(
        `UPDATE preferences SET
          preferred_location = ?,
          min_budget = ?,
          max_budget = ?,
          preferred_food = ?,
          preferred_smoking_status = ?,
          preferred_study_schedule = ?,
          preferred_sleeping_schedule = ?,
          preferred_cleanliness = ?,
          preferred_roommate_count = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?`,
        [
          preferred_location ? preferred_location.trim() : null,
          parsedMin,
          parsedMax,
          preferred_food || 'any',
          preferred_smoking_status || 'any',
          preferred_study_schedule || 'flexible',
          preferred_sleeping_schedule || 'flexible',
          preferred_cleanliness || 'any',
          parsedCount,
          userId
        ]
      );
    } else {
      await pool.query(
        `INSERT INTO preferences (
          user_id, preferred_location, min_budget, max_budget, preferred_food,
          preferred_smoking_status, preferred_study_schedule, preferred_sleeping_schedule,
          preferred_cleanliness, preferred_roommate_count
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          preferred_location ? preferred_location.trim() : null,
          parsedMin,
          parsedMax,
          preferred_food || 'any',
          preferred_smoking_status || 'any',
          preferred_study_schedule || 'flexible',
          preferred_sleeping_schedule || 'flexible',
          preferred_cleanliness || 'any',
          parsedCount
        ]
      );
    }

    res.status(200).json({
      success: true,
      message: 'Roommate preferences saved successfully.'
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getMyPreferences,
  updateMyPreferences
};
