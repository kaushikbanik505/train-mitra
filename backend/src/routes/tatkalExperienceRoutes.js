const express = require('express');
const { getInsight, submitExperience } = require('../controllers/tatkalExperienceController');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.get('/:train', getInsight);
router.post('/', verifyToken, submitExperience);

module.exports = router;
