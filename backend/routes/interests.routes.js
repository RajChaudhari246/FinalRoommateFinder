const express = require('express');
const router = express.Router();
const interestsController = require('../controllers/interests.controller');
const { requireAuth } = require('../middleware/auth.middleware');

router.post('/', requireAuth, interestsController.expressInterest);
router.get('/received', requireAuth, interestsController.getReceivedInterests);
router.get('/sent', requireAuth, interestsController.getSentInterests);
router.patch('/:id', requireAuth, interestsController.updateInterestStatus);

module.exports = router;
