/**
 * Profile Controller
 * Manages viewing and editing the authenticated user's profile and viewing public profiles.
 */
const { pool } = require('../config/database');

async function getMyProfile(req, res, next) {
  const userId = req.session.userId;

  try {
    const [rows] = await pool.query(
      `SELECT p.*, u.full_name, u.email
       FROM profiles p
       JOIN users u ON p.user_id = u.id
       WHERE p.user_id = ?`,
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found.'
      });
    }

    res.status(200).json({
      success: true,
      profile: rows[0]
    });
  } catch (error) {
    next(error);
  }
}

async function updateMyProfile(req, res, next) {
  const userId = req.session.userId;
  const {
    age,
    gender,
    city,
    preferred_location,
    college_or_workplace,
    min_budget,
    max_budget,
    food_preference,
    smoking_preference,
    drinking_preference,
    study_schedule,
    sleeping_schedule,
    cleanliness_preference,
    preferred_roommate_count,
    about_me,
    profile_photo_path,
    security_curfew,
    security_visitor_policy,
    security_amenities,
    security_emergency_contact,
    security_notes
  } = req.body;

  try {
    const parsedAge = age ? parseInt(age, 10) : null;
    const parsedMin = parseFloat(min_budget) || 0;
    const parsedMax = parseFloat(max_budget) || 0;
    const parsedCount = parseInt(preferred_roommate_count, 10) || 1;

    // Check completeness
    const isComplete = Boolean(
      city && city !== 'Not Specified' &&
      preferred_location && preferred_location !== 'Not Specified' &&
      parsedMax > 0 &&
      food_preference &&
      sleeping_schedule
    );

    const updateQuery = `
      UPDATE profiles
      SET age = ?,
          gender = ?,
          city = ?,
          preferred_location = ?,
          college_or_workplace = ?,
          min_budget = ?,
          max_budget = ?,
          food_preference = ?,
          smoking_preference = ?,
          drinking_preference = ?,
          study_schedule = ?,
          sleeping_schedule = ?,
          cleanliness_preference = ?,
          preferred_roommate_count = ?,
          about_me = ?,
          profile_photo_path = ?,
          security_curfew = ?,
          security_visitor_policy = ?,
          security_amenities = ?,
          security_emergency_contact = ?,
          security_notes = ?,
          is_complete = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `;

    const params = [
      parsedAge,
      gender || null,
      city.trim(),
      preferred_location.trim(),
      college_or_workplace ? college_or_workplace.trim() : null,
      parsedMin,
      parsedMax,
      food_preference || 'any',
      smoking_preference || 'non-smoker',
      drinking_preference || 'non-drinker',
      study_schedule || 'flexible',
      sleeping_schedule || 'flexible',
      cleanliness_preference || 'moderate',
      parsedCount,
      about_me ? about_me.trim() : null,
      profile_photo_path || null,
      security_curfew || null,
      security_visitor_policy || null,
      security_amenities || null,
      security_emergency_contact || null,
      security_notes ? security_notes.trim() : null,
      isComplete,
      userId
    ];

    const [result] = await pool.query(updateQuery, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Profile could not be found or updated.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      is_complete: isComplete
    });
  } catch (error) {
    next(error);
  }
}

async function getPublicProfile(req, res, next) {
  const targetUserId = parseInt(req.params.id, 10);

  if (isNaN(targetUserId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid profile user ID.'
    });
  }

  try {
    const [rows] = await pool.query(
      `SELECT u.id as user_id, u.full_name, u.created_at as member_since,
              p.age, p.gender, p.city, p.preferred_location, p.college_or_workplace,
              p.min_budget, p.max_budget, p.food_preference, p.smoking_preference,
              p.drinking_preference, p.study_schedule, p.sleeping_schedule,
              p.cleanliness_preference, p.preferred_roommate_count, p.about_me,
              p.profile_photo_path, p.is_complete,
              p.security_curfew, p.security_visitor_policy, p.security_amenities,
              p.security_emergency_contact, p.security_notes
       FROM users u
       JOIN profiles p ON u.id = p.user_id
       WHERE u.id = ? AND u.account_status = 'active'`,
      [targetUserId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found or is unavailable.'
      });
    }

    res.status(200).json({
      success: true,
      profile: rows[0]
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getMyProfile,
  updateMyProfile,
  getPublicProfile
};
