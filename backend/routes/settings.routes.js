const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settings.controller');
const { requireAuth } = require('../middleware/auth.middleware');

router.get('/account', requireAuth, settingsController.getAccountDetails);
router.put('/password', requireAuth, settingsController.changePassword);
router.post('/deactivate', requireAuth, settingsController.deactivateAccount);

module.exports = router;
