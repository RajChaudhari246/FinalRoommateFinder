const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profile.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { validateProfileUpdate } = require('../middleware/validate.middleware');

router.get('/me', requireAuth, profileController.getMyProfile);
router.put('/me', requireAuth, validateProfileUpdate, profileController.updateMyProfile);
router.get('/:id', profileController.getPublicProfile);

module.exports = router;
