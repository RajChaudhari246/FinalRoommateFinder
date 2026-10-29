/**
 * Authentication Controller
 * Handles user registration, login, session generation, logout, and auth check.
 */
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

async function register(req, res, next) {
  const { full_name, email, password, gender } = req.body;
  const normalizedEmail = email.toLowerCase().trim();
  const trimmedName = full_name.trim();

  // Normalize gender wing (Female for Girls Wing, Male for Boys Wing)
  let normalizedGender = 'Male';
  if (gender) {
    const gLower = String(gender).toLowerCase().trim();
    if (gLower === 'female' || gLower === 'girls') {
      normalizedGender = 'Female';
    } else {
      normalizedGender = 'Male';
    }
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Check duplicate email
    const [existing] = await connection.query(
      'SELECT id FROM users WHERE email = ?',
      [normalizedEmail]
    );

    if (existing.length > 0) {
      await connection.rollback();
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists. Please log in.'
      });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert user
    const [userResult] = await connection.query(
      'INSERT INTO users (full_name, email, password_hash) VALUES (?, ?, ?)',
      [trimmedName, normalizedEmail, passwordHash]
    );

    const userId = userResult.insertId;

    // Create default profile record with assigned gender
    await connection.query(
      `INSERT INTO profiles (user_id, gender, city, preferred_location, min_budget, max_budget, is_complete)
       VALUES (?, ?, 'Shirpur', 'Not Specified', 0.00, 0.00, FALSE)`,
      [userId, normalizedGender]
    );

    // Create default preferences record with matching preferred gender wing
    await connection.query(
      'INSERT INTO preferences (user_id, preferred_gender) VALUES (?, ?)',
      [userId, normalizedGender]
    );

    await connection.commit();

    // Regenerate session to prevent session fixation
    req.session.regenerate((err) => {
      if (err) {
        return next(err);
      }
      req.session.userId = userId;
      req.session.userEmail = normalizedEmail;
      req.session.userName = trimmedName;
      req.session.userRole = 'user';
      req.session.userGender = normalizedGender;

      res.status(201).json({
        success: true,
        message: 'Account created successfully.',
        user: {
          id: userId,
          full_name: trimmedName,
          email: normalizedEmail,
          role: 'user',
          gender: normalizedGender,
          is_complete: false
        }
      });
    });

  } catch (error) {
    if (connection) await connection.rollback();
    next(error);
  } finally {
    if (connection) connection.release();
  }
}

async function login(req, res, next) {
  const { email, password } = req.body;
  const normalizedEmail = (email || '').toLowerCase().trim();

  try {
    const [users] = await pool.query(
      `SELECT u.id, u.full_name, u.email, u.password_hash, u.account_status, u.role,
              p.gender, p.is_complete, p.city, p.min_budget, p.max_budget
       FROM users u
       LEFT JOIN profiles p ON u.id = p.user_id
       WHERE u.email = ?`,
      [normalizedEmail]
    );

    if (users.length === 0) {
      // Avoid revealing whether account exists
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const user = users[0];

    if (user.account_status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'This account has been deactivated. Please contact support.'
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Regenerate session upon successful login
    req.session.regenerate((err) => {
      if (err) {
        return next(err);
      }
      req.session.userId = user.id;
      req.session.userEmail = user.email;
      req.session.userName = user.full_name;
      req.session.userRole = user.role || 'user';
      req.session.userGender = user.gender || null;

      res.status(200).json({
        success: true,
        message: 'Login successful.',
        user: {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          city: user.city,
          role: user.role || 'user',
          gender: user.gender || null,
          is_complete: Boolean(user.is_complete)
        }
      });
    });

  } catch (error) {
    next(error);
  }
}

async function logout(req, res, next) {
  if (!req.session) {
    return res.status(200).json({ success: true, message: 'Already logged out.' });
  }

  req.session.destroy((err) => {
    if (err) {
      return next(err);
    }
    res.clearCookie('connect.sid');
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully.'
    });
  });
}

async function me(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({
      success: false,
      authenticated: false,
      message: 'Not logged in.'
    });
  }

  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.full_name, u.email, u.role, u.created_at,
              p.gender, p.is_complete, p.city, p.preferred_location, p.min_budget, p.max_budget,
              p.food_preference, p.smoking_preference, p.study_schedule, p.sleeping_schedule,
              p.cleanliness_preference, p.preferred_roommate_count, p.about_me
       FROM users u
       LEFT JOIN profiles p ON u.id = p.user_id
       WHERE u.id = ? AND u.account_status = 'active'`,
      [req.session.userId]
    );

    if (rows.length === 0) {
      req.session.destroy();
      return res.status(401).json({
        success: false,
        authenticated: false,
        message: 'User account no longer active or exists.'
      });
    }

    const userData = rows[0];
    req.session.userRole = userData.role || 'user';
    req.session.userGender = userData.gender || null;

    res.status(200).json({
      success: true,
      authenticated: true,
      user: {
        id: userData.id,
        full_name: userData.full_name,
        email: userData.email,
        role: userData.role || 'user',
        gender: userData.gender || null,
        created_at: userData.created_at,
        is_complete: Boolean(userData.is_complete),
        profile: {
          gender: userData.gender || null,
          city: userData.city,
          preferred_location: userData.preferred_location,
          min_budget: userData.min_budget,
          max_budget: userData.max_budget,
          food_preference: userData.food_preference,
          smoking_preference: userData.smoking_preference,
          study_schedule: userData.study_schedule,
          sleeping_schedule: userData.sleeping_schedule,
          cleanliness_preference: userData.cleanliness_preference,
          preferred_roommate_count: userData.preferred_roommate_count,
          about_me: userData.about_me
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  register,
  login,
  logout,
  me
};
