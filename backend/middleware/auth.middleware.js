/**
 * Authentication Middleware
 * Ensures user is authenticated via server-side session.
 */
function requireAuth(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  }
  return res.status(401).json({
    success: false,
    message: 'Authentication required. Please log in to continue.'
  });
}

module.exports = {
  requireAuth
};
