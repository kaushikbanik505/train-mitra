const express = require('express');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({ status: 'ok' });
});

// Temporary route to sanity-check auth + RBAC middleware during Step 1
router.get('/admin-only', verifyToken, requireRole('admin'), (req, res) => {
  res.json({ message: `Hello admin ${req.user.userId}` });
});

module.exports = router;
