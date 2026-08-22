const express = require('express');
const { listUpdates, createUpdate } = require('../controllers/liveStatusController');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.get('/:train/:date', listUpdates);
router.post('/', verifyToken, createUpdate);

module.exports = router;
