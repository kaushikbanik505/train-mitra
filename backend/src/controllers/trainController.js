const Train = require('../models/Train');
const CITY_ALIASES = require('../data/cityAliases');

async function searchTrains(req, res) {
  try {
    const q = (req.query.q || '').trim();
    if (!q) {
      return res.json([]);
    }

    const regex = new RegExp(q, 'i');
    const trains = await Train.find({
      $or: [{ trainNumber: regex }, { trainName: regex }],
    })
      .select('trainNumber trainName origin destination')
      .limit(10);

    res.json(trains);
  } catch (err) {
    res.status(500).json({ message: 'Search failed', error: err.message });
  }
}

async function getTrainByNumber(req, res) {
  try {
    const train = await Train.findOne({ trainNumber: req.params.trainNumber });
    if (!train) {
      return res.status(404).json({ message: 'Train not found' });
    }
    res.json(train);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch train', error: err.message });
  }
}

async function searchStations(req, res) {
  try {
    const q = (req.query.q || '').trim();
    if (!q) {
      return res.json([]);
    }

    const regex = new RegExp(q, 'i');
    const nameOrCodeMatches = await Train.aggregate([
      { $unwind: '$stops' },
      { $match: { $or: [{ 'stops.stationName': regex }, { 'stops.stationCode': regex }] } },
      { $group: { _id: '$stops.stationCode', stationName: { $first: '$stops.stationName' } } },
      { $project: { _id: 0, stationCode: '$_id', stationName: 1 } },
    ]);

    // City aliasing: e.g. "kolkata" should also surface Howrah Jn / Sealdah, whose
    // names don't contain the word "Kolkata" at all.
    const normalizedQuery = q.toLowerCase().replace(/\s+/g, '');
    const cityKey = Object.keys(CITY_ALIASES).find(
      (city) => city.startsWith(normalizedQuery) || normalizedQuery.startsWith(city)
    );

    let cityMatches = [];
    if (cityKey) {
      cityMatches = await Train.aggregate([
        { $unwind: '$stops' },
        { $match: { 'stops.stationCode': { $in: CITY_ALIASES[cityKey] } } },
        { $group: { _id: '$stops.stationCode', stationName: { $first: '$stops.stationName' } } },
        { $project: { _id: 0, stationCode: '$_id', stationName: 1 } },
      ]);
    }

    const seen = new Set();
    const stations = [...cityMatches, ...nameOrCodeMatches].filter((s) => {
      if (seen.has(s.stationCode)) return false;
      seen.add(s.stationCode);
      return true;
    });
    stations.sort((a, b) => a.stationName.localeCompare(b.stationName));

    res.json(stations.slice(0, 10));
  } catch (err) {
    res.status(500).json({ message: 'Station search failed', error: err.message });
  }
}

function toAbsoluteMinutes(dayOfJourney, time) {
  const [h, m] = time.split(':').map(Number);
  return (dayOfJourney - 1) * 1440 + h * 60 + m;
}

async function findDirectTrains(from, to) {
  const trains = await Train.find({
    'stops.stationCode': from,
    $and: [{ 'stops.stationCode': to }],
  }).select('trainNumber trainName stops');

  return trains
    .map((t) => {
      const fromStop = t.stops.find((s) => s.stationCode === from);
      const toStop = t.stops.find((s) => s.stationCode === to);
      if (!fromStop || !toStop || fromStop.sequence >= toStop.sequence) return null;

      return {
        trainNumber: t.trainNumber,
        trainName: t.trainName,
        from: {
          stationName: fromStop.stationName,
          stationCode: fromStop.stationCode,
          departureTime: fromStop.departureTime,
          dayOfJourney: fromStop.dayOfJourney,
        },
        to: {
          stationName: toStop.stationName,
          stationCode: toStop.stationCode,
          arrivalTime: toStop.arrivalTime,
          dayOfJourney: toStop.dayOfJourney,
        },
        durationMinutes:
          toAbsoluteMinutes(toStop.dayOfJourney, toStop.arrivalTime) -
          toAbsoluteMinutes(fromStop.dayOfJourney, fromStop.departureTime),
      };
    })
    .filter(Boolean);
}

// Every other station code sharing a city cluster with `code`, e.g. HWH -> [SDAH, SHM, KOAA].
function sameCityCodes(code) {
  const merged = new Set();
  for (const codes of Object.values(CITY_ALIASES)) {
    if (codes.includes(code)) codes.forEach((c) => merged.add(c));
  }
  merged.delete(code);
  return [...merged];
}

function sortByDeparture(matches) {
  return matches.sort((a, b) => (a.from.departureTime || '').localeCompare(b.from.departureTime || ''));
}

async function searchByRoute(req, res) {
  try {
    const from = (req.query.from || '').trim().toUpperCase();
    const to = (req.query.to || '').trim().toUpperCase();
    if (!from || !to) {
      return res.status(400).json({ message: 'Both from and to station codes are required' });
    }
    if (from === to) {
      return res.status(400).json({ message: 'From and to stations must be different' });
    }

    const direct = sortByDeparture(await findDirectTrains(from, to));
    if (direct.length > 0) {
      return res.json({ exact: true, results: direct });
    }

    // No exact match - fall back to trains reaching a different station in the same
    // city as `from` and/or `to` (e.g. searched Howrah, real train only reaches Sealdah).
    const altToCodes = sameCityCodes(to);
    const altFromCodes = sameCityCodes(from);

    const nearbyBatches = await Promise.all([
      ...altToCodes.map((altTo) => findDirectTrains(from, altTo)),
      ...altFromCodes.map((altFrom) => findDirectTrains(altFrom, to)),
    ]);

    const seen = new Set();
    const nearby = sortByDeparture(
      nearbyBatches.flat().filter((m) => {
        if (seen.has(m.trainNumber)) return false;
        seen.add(m.trainNumber);
        return true;
      })
    );

    res.json({ exact: false, results: nearby });
  } catch (err) {
    res.status(500).json({ message: 'Route search failed', error: err.message });
  }
}

module.exports = { searchTrains, getTrainByNumber, searchStations, searchByRoute };
