const Train = require('../models/Train');
const DelayReport = require('../models/DelayReport');
const LiveStatusUpdate = require('../models/LiveStatusUpdate');
const JourneyExperience = require('../models/JourneyExperience');
const TatkalExperience = require('../models/TatkalExperience');
const CITY_ALIASES = require('../data/cityAliases');
const { todayIST } = require('../utils/dateUtils');

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function nowIST() {
  return new Date(Date.now() + IST_OFFSET_MS);
}

// Same rule TrainSearch.jsx uses client-side: Tatkal opens daily at a fixed IST clock
// hour, one day before the journey - next occurrence is today if not yet passed, else tomorrow.
function nextISTClockTime(hour) {
  const shiftedNow = nowIST();
  const shiftedNext = new Date(shiftedNow);
  shiftedNext.setUTCHours(hour, 0, 0, 0);
  if (shiftedNext <= shiftedNow) shiftedNext.setUTCDate(shiftedNext.getUTCDate() + 1);
  return new Date(shiftedNext.getTime() - IST_OFFSET_MS);
}

function formatIST(date) {
  return date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

async function searchTrains({ query }) {
  const q = (query || '').trim();
  if (!q) return { results: [] };
  const regex = new RegExp(q, 'i');
  const trains = await Train.find({ $or: [{ trainNumber: regex }, { trainName: regex }] })
    .select('trainNumber trainName origin destination')
    .limit(8)
    .lean();
  return { results: trains };
}

async function getTrainDetails({ trainNumber }) {
  const train = await Train.findOne({ trainNumber: (trainNumber || '').trim() }).lean();
  if (!train) return { found: false };

  const acOpening = nextISTClockTime(10);
  const slOpening = nextISTClockTime(11);

  return {
    found: true,
    trainNumber: train.trainNumber,
    trainName: train.trainName,
    origin: train.origin,
    destination: train.destination,
    totalStops: train.stops.length,
    stops: train.stops.map((s) => ({
      stationName: s.stationName,
      stationCode: s.stationCode,
      arrivalTime: s.arrivalTime,
      departureTime: s.departureTime,
      dayOfJourney: s.dayOfJourney,
    })),
    tatkal: {
      opensFromStation: train.origin.stationName,
      oneDayBeforeJourney: true,
      acAndExecutiveOpensAt: formatIST(acOpening),
      sleeperAndSecondSittingOpensAt: formatIST(slOpening),
    },
  };
}

// Shared by the search_stations tool and the free-text from/to args of search_route,
// so the model can resolve a city/station name to code(s) without a separate tool round-trip.
async function resolveStationCodes(query) {
  const q = (query || '').trim();
  if (!q) return [];

  const regex = new RegExp(q, 'i');
  const nameOrCodeMatches = await Train.aggregate([
    { $unwind: '$stops' },
    { $match: { $or: [{ 'stops.stationName': regex }, { 'stops.stationCode': regex }] } },
    { $group: { _id: '$stops.stationCode', stationName: { $first: '$stops.stationName' } } },
    { $project: { _id: 0, stationCode: '$_id', stationName: 1 } },
    { $limit: 10 },
  ]);

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
  return [...cityMatches, ...nameOrCodeMatches].filter((s) => {
    if (seen.has(s.stationCode)) return false;
    seen.add(s.stationCode);
    return true;
  });
}

async function searchStations({ query }) {
  const results = await resolveStationCodes(query);
  return { results: results.slice(0, 10) };
}

function toAbsoluteMinutes(dayOfJourney, time) {
  const [h, m] = time.split(':').map(Number);
  return (dayOfJourney - 1) * 1440 + h * 60 + m;
}

async function findDirectTrains(from, to) {
  const trains = await Train.find({
    'stops.stationCode': from,
    $and: [{ 'stops.stationCode': to }],
  }).select('trainNumber trainName stops').lean();

  return trains
    .map((t) => {
      const fromStop = t.stops.find((s) => s.stationCode === from);
      const toStop = t.stops.find((s) => s.stationCode === to);
      if (!fromStop || !toStop || fromStop.sequence >= toStop.sequence) return null;
      return {
        trainNumber: t.trainNumber,
        trainName: t.trainName,
        departureTime: fromStop.departureTime,
        arrivalTime: toStop.arrivalTime,
        durationMinutes:
          toAbsoluteMinutes(toStop.dayOfJourney, toStop.arrivalTime) -
          toAbsoluteMinutes(fromStop.dayOfJourney, fromStop.departureTime),
      };
    })
    .filter(Boolean);
}

// Accepts free-text city/station names or codes directly (e.g. "Delhi", "Mumbai") and
// resolves them itself - one tool call instead of the model chaining a station lookup
// before the route search, which was the main source of extra latency on these queries.
async function searchRoute({ from, to }) {
  const [fromStations, toStations] = await Promise.all([resolveStationCodes(from), resolveStationCodes(to)]);
  if (!fromStations.length || !toStations.length) {
    return {
      results: [],
      note: !fromStations.length && !toStations.length
        ? `Could not resolve either "${from}" or "${to}" to a known station.`
        : !fromStations.length
          ? `Could not resolve "${from}" to a known station.`
          : `Could not resolve "${to}" to a known station.`,
    };
  }

  const pairs = [];
  for (const f of fromStations.slice(0, 5)) {
    for (const t of toStations.slice(0, 5)) {
      if (f.stationCode !== t.stationCode) pairs.push([f, t]);
    }
  }

  const batches = await Promise.all(pairs.map(([f, t]) => findDirectTrains(f.stationCode, t.stationCode)));
  const seen = new Set();
  const results = batches.flat().filter((r) => {
    if (seen.has(r.trainNumber)) return false;
    seen.add(r.trainNumber);
    return true;
  });
  results.sort((a, b) => (a.departureTime || '').localeCompare(b.departureTime || ''));

  return {
    resolvedFrom: fromStations.slice(0, 5),
    resolvedTo: toStations.slice(0, 5),
    results: results.slice(0, 8),
  };
}

async function getDelayReports({ trainNumber }) {
  const journeyDate = todayIST();
  const reports = await DelayReport.find({ trainNumber: (trainNumber || '').trim(), journeyDate })
    .sort({ createdAt: -1 })
    .limit(10)
    .select('reason upvotes downvotes createdAt')
    .lean();
  return { journeyDate, reports };
}

async function getLiveStatus({ trainNumber }) {
  const journeyDate = todayIST();
  const updates = await LiveStatusUpdate.find({ trainNumber: (trainNumber || '').trim(), journeyDate })
    .sort({ timestamp: -1 })
    .limit(10)
    .select('stationName platformNumber message timestamp')
    .lean();
  return { journeyDate, updates };
}

async function getJourneyExperience({ trainNumber }) {
  const RATING_FIELDS = ['cleanliness', 'food', 'staffBehaviour', 'punctuality', 'safety'];
  const groupStage = { _id: null, count: { $sum: 1 } };
  RATING_FIELDS.forEach((field) => { groupStage[field] = { $avg: `$${field}` }; });

  const [summary] = await JourneyExperience.aggregate([
    { $match: { trainNumber: (trainNumber || '').trim() } },
    { $group: groupStage },
  ]);

  if (!summary) return { hasData: false };

  const averages = { count: summary.count };
  RATING_FIELDS.forEach((field) => { averages[field] = Math.round(summary[field] * 10) / 10; });

  return { hasData: true, averages };
}

async function getTatkalExperience({ trainNumber }) {
  const rows = await TatkalExperience.aggregate([
    { $match: { trainNumber: (trainNumber || '').trim() } },
    { $group: { _id: '$seatCategory', avgMinutesToSellOut: { $avg: '$estimatedMinutesToSellOut' }, count: { $sum: 1 } } },
  ]);
  if (!rows.length) return { hasData: false };
  const insight = {};
  rows.forEach((row) => {
    insight[row._id] = { avgMinutesToSellOut: Math.round(row.avgMinutesToSellOut * 10) / 10, count: row.count };
  });
  return { hasData: true, insight };
}

const TOOL_DECLARATIONS = [
  {
    name: 'search_trains',
    description: "Search TrainMitra's database for trains by number or (partial) name.",
    parametersJsonSchema: {
      type: 'object',
      properties: { query: { type: 'string', description: 'Train number or name (partial match ok)' } },
      required: ['query'],
    },
  },
  {
    name: 'get_train_details',
    description: 'Get full details for one train by its exact number: origin, destination, all stops with timings, and its Tatkal booking opening times.',
    parametersJsonSchema: {
      type: 'object',
      properties: { trainNumber: { type: 'string' } },
      required: ['trainNumber'],
    },
  },
  {
    name: 'search_stations',
    description: 'Resolve a city or station name/partial name to station codes (e.g. "kolkata" -> HWH, SDAH).',
    parametersJsonSchema: {
      type: 'object',
      properties: { query: { type: 'string' } },
      required: ['query'],
    },
  },
  {
    name: 'search_route',
    description: 'Find direct trains between two places. Pass city or station names directly (e.g. "Delhi", "Mumbai") - it resolves them itself, no need to call search_stations first.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        from: { type: 'string', description: 'Origin city or station name' },
        to: { type: 'string', description: 'Destination city or station name' },
      },
      required: ['from', 'to'],
    },
  },
  {
    name: 'get_delay_reports',
    description: "Get today's crowdsourced delay reports for a train, ranked by community votes.",
    parametersJsonSchema: {
      type: 'object',
      properties: { trainNumber: { type: 'string' } },
      required: ['trainNumber'],
    },
  },
  {
    name: 'get_live_status',
    description: "Get today's crowdsourced live location updates for a train (station, platform, passenger notes).",
    parametersJsonSchema: {
      type: 'object',
      properties: { trainNumber: { type: 'string' } },
      required: ['trainNumber'],
    },
  },
  {
    name: 'get_journey_experience',
    description: 'Get average passenger ratings for a train: cleanliness, food, staff behaviour, punctuality, safety.',
    parametersJsonSchema: {
      type: 'object',
      properties: { trainNumber: { type: 'string' } },
      required: ['trainNumber'],
    },
  },
  {
    name: 'get_tatkal_experience',
    description: 'Get crowdsourced estimates of how many minutes after Tatkal opening a train historically sells out, per seat category.',
    parametersJsonSchema: {
      type: 'object',
      properties: { trainNumber: { type: 'string' } },
      required: ['trainNumber'],
    },
  },
];

const TOOL_HANDLERS = {
  search_trains: searchTrains,
  get_train_details: getTrainDetails,
  search_stations: searchStations,
  search_route: searchRoute,
  get_delay_reports: getDelayReports,
  get_live_status: getLiveStatus,
  get_journey_experience: getJourneyExperience,
  get_tatkal_experience: getTatkalExperience,
};

async function runTool(name, args) {
  const handler = TOOL_HANDLERS[name];
  if (!handler) return { error: `Unknown tool: ${name}` };
  try {
    return await handler(args || {});
  } catch (err) {
    return { error: `Tool ${name} failed: ${err.message}` };
  }
}

module.exports = { TOOL_DECLARATIONS, runTool };
