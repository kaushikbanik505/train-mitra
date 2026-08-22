const express = require('express');
const { getQuota, listReports, createReport, voteReport } = require('../controllers/delayReportController');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Must come before '/:train' or Express would match "quota" as a train number.
router.get('/quota', verifyToken, getQuota);
router.get('/:train', listReports);
router.post('/', verifyToken, createReport);
router.post('/:id/vote', verifyToken, voteReport);

module.exports = router;
