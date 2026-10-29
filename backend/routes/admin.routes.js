/**
 * Admin Routes
 * Protected endpoints restricted to authenticated system administrators.
 */
const express = require('express');
const router = express.Router();

const { requireAuth, requireAdmin } = require('../middleware/auth.middleware');
const adminController = require('../controllers/admin.controller');

// Enforce both authentication and administrator privileges across all admin routes
router.use(requireAuth, requireAdmin);

// Platform Overview & KPI Metrics
router.get('/metrics', adminController.getMetrics);

// User Directory & New Users Stream
router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUserDetails);

// User Management Actions
router.patch('/users/:id/status', adminController.updateUserStatus);
router.patch('/users/:id/role', adminController.updateUserRole);
router.delete('/users/:id', adminController.deleteUser);

// Activity Stream & Live Log
router.get('/activity', adminController.getActivityStream);

// Admin Profile & Privileges
router.get('/profile', adminController.getAdminProfile);

module.exports = router;
