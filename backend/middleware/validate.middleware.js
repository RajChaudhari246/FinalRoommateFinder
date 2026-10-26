/**
 * Input Validation Middleware & Helpers
 */

function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

function validateRegister(req, res, next) {
  const { full_name, email, password, confirm_password } = req.body;

  if (!full_name || typeof full_name !== 'string' || full_name.trim().length < 2) {
    return res.status(400).json({
      success: false,
      message: 'Full name is required and must be at least 2 characters long.'
    });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid email address.'
    });
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters long.'
    });
  }

  if (confirm_password !== undefined && password !== confirm_password) {
    return res.status(400).json({
      success: false,
      message: 'Password and Confirm Password do not match.'
    });
  }

  next();
}

function validateLogin(req, res, next) {
  const { email, password } = req.body;

  if (!isValidEmail(email)) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid email address.'
    });
  }

  if (!password || typeof password !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Password is required.'
    });
  }

  next();
}

function validateProfileUpdate(req, res, next) {
  const { min_budget, max_budget, city, preferred_location } = req.body;

  if (!city || typeof city !== 'string' || city.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'City is required.'
    });
  }

  if (!preferred_location || typeof preferred_location !== 'string' || preferred_location.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Preferred location/neighborhood is required.'
    });
  }

  const minB = parseFloat(min_budget);
  const maxB = parseFloat(max_budget);

  if (isNaN(minB) || minB < 0) {
    return res.status(400).json({
      success: false,
      message: 'Minimum budget must be a positive number.'
    });
  }

  if (isNaN(maxB) || maxB < minB) {
    return res.status(400).json({
      success: false,
      message: 'Maximum budget must be greater than or equal to minimum budget.'
    });
  }

  next();
}

function validatePreferencesUpdate(req, res, next) {
  const { min_budget, max_budget } = req.body;

  if (min_budget !== undefined && min_budget !== null && min_budget !== '') {
    const minB = parseFloat(min_budget);
    if (isNaN(minB) || minB < 0) {
      return res.status(400).json({
        success: false,
        message: 'Minimum budget must be a non-negative number.'
      });
    }
  }

  if (max_budget !== undefined && max_budget !== null && max_budget !== '') {
    const maxB = parseFloat(max_budget);
    const minB = min_budget ? parseFloat(min_budget) : 0;
    if (isNaN(maxB) || maxB < minB) {
      return res.status(400).json({
        success: false,
        message: 'Maximum budget cannot be less than minimum budget.'
      });
    }
  }

  next();
}

module.exports = {
  isValidEmail,
  validateRegister,
  validateLogin,
  validateProfileUpdate,
  validatePreferencesUpdate
};
