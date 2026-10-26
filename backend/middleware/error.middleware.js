/**
 * Central Error Handler Middleware
 * Catches unhandled errors, formats clean responses, and prevents internal credential leaks.
 */

function errorHandler(err, req, res, next) {
  console.error('[Unhandled Error]', err.stack || err.message);

  // MySQL database connection / authentication errors
  if (err.code === 'ER_ACCESS_DENIED_ERROR' || err.code === 'ECONNREFUSED' || err.code === 'ER_BAD_DB_ERROR') {
    return res.status(503).json({
      success: false,
      message: 'Database service is currently unavailable. Please check server configuration or contact the administrator.'
    });
  }

  // MySQL constraint errors
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      message: 'A record with this information already exists.'
    });
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({
      success: false,
      message: 'Referenced user or record was not found.'
    });
  }

  const statusCode = err.status || err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'An unexpected internal server error occurred.'
    : (err.code && err.code.startsWith('ER_') ? 'A database error occurred. Please try again later.' : (err.message || 'Internal Server Error'));

  res.status(statusCode).json({
    success: false,
    message
  });
}

function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    message: `Endpoint ${req.originalUrl} not found.`
  });
}

module.exports = {
  errorHandler,
  notFoundHandler
};
