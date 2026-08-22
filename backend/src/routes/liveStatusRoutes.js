const express = require('express');
const { getQuota, listUpdates, createUpdate, voteUpdate } = require('../controllers/liveStatusController');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Must come before '/:train' or Express would match "quota" as a train number.
router.get('/quota', verifyToken, getQuota);
router.get('/:train', listUpdates);
router.post('/', verifyToken, createUpdate);
router.post('/:id/vote', verifyToken, voteUpdate);

module.exports = router;
