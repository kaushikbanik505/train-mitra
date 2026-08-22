const express = require('express');
const { searchTrains, getTrainByNumber, searchStations, searchByRoute } = require('../controllers/trainController');

const router = express.Router();

router.get('/search', searchTrains);
router.get('/stations/search', searchStations);
router.get('/route', searchByRoute);
router.get('/:trainNumber', getTrainByNumber);

module.exports = router;
