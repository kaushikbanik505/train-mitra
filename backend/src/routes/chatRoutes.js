const express = require('express');
const { chat } = require('../controllers/chatController');
const chatRateLimit = require('../middleware/chatRateLimit');

const router = express.Router();

router.post('/', chatRateLimit, chat);

module.exports = router;
