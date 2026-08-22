const express = require('express');
const { verifyToken } = require('../middleware/auth');
const { getMe, updateMe } = require('../controllers/userController');

const router = express.Router();

router.get('/me', verifyToken, getMe);
router.patch('/me', verifyToken, updateMe);

module.exports = router;
