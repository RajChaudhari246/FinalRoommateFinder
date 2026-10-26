const express = require('express');
const router = express.Router();
const preferencesController = require('../controllers/preferences.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { validatePreferencesUpdate } = require('../middleware/validate.middleware');

router.get('/me', requireAuth, preferencesController.getMyPreferences);
router.put('/me', requireAuth, validatePreferencesUpdate, preferencesController.updateMyPreferences);

module.exports = router;
