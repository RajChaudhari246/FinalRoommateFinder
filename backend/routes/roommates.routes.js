const express = require('express');
const router = express.Router();
const roommatesController = require('../controllers/roommates.controller');

router.get('/', roommatesController.getRoommates);
router.get('/:id/compatibility', roommatesController.getRoommateCompatibility);

module.exports = router;
