const express = require('express');
const { getInsight, getMine, submitExperience } = require('../controllers/journeyExperienceController');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.get('/:train/mine', verifyToken, getMine);
router.get('/:train', getInsight);
router.post('/', verifyToken, submitExperience);

module.exports = router;
