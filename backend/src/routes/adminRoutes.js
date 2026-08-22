const express = require('express');
const {
  getOverview,
  listDelayReports,
  deleteDelayReport,
  listLiveStatus,
  deleteLiveStatus,
  listOnlineUsers,
  listUsers,
  toggleBan,
} = require('../controllers/adminController');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Every route below requires a real 'admin' role, checked server-side off the JWT -
// not just a frontend email check, since these routes can delete data and ban users.
router.use(verifyToken, requireRole('admin'));

router.get('/overview', getOverview);
router.get('/delay-reports', listDelayReports);
router.delete('/delay-reports/:id', deleteDelayReport);
router.get('/live-status', listLiveStatus);
router.delete('/live-status/:id', deleteLiveStatus);
router.get('/online-users', listOnlineUsers);
router.get('/users', listUsers);
router.patch('/users/:id/ban', toggleBan);

module.exports = router;
