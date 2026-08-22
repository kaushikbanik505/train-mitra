require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Train = require('../models/Train');
const rows = require('./data/irctcTrains2016.json');

// Sourced from datameet/railways (CC0), a 2016 snapshot of real Indian Railways
// train numbers/names/routes. No per-station stop schedule was reliable enough to
// import (spot-checked and found corrupted - see project notes), so each imported
// train only has its real origin and destination as stops, with real departure/
// arrival times and distance. Hand-curated trains (seedTrains.js) keep their full
// multi-stop timelines and are never overwritten by this import.
function dayOfJourneyForArrival(departure, durationMinutes) {
  const [h, m] = departure.split(':').map(Number);
  const departureMinutes = h * 60 + m;
  return 1 + Math.floor((departureMinutes + durationMinutes) / 1440);
}

async function importTrains() {
  await connectDB();

  const existingNumbers = new Set(await Train.distinct('trainNumber'));
  const seen = new Set();
  const docs = [];

  for (const row of rows) {
    if (existingNumbers.has(row.trainNumber) || seen.has(row.trainNumber)) continue;
    seen.add(row.trainNumber);

    docs.push({
      trainNumber: row.trainNumber,
      trainName: row.trainName,
      origin: { stationName: row.fromName, stationCode: row.fromCode },
      destination: { stationName: row.toName, stationCode: row.toCode },
      stops: [
        {
          sequence: 1,
          stationName: row.fromName,
          stationCode: row.fromCode,
          distanceKm: 0,
          dayOfJourney: 1,
          arrivalTime: null,
          departureTime: row.departure,
        },
        {
          sequence: 2,
          stationName: row.toName,
          stationCode: row.toCode,
          distanceKm: row.distanceKm,
          dayOfJourney: dayOfJourneyForArrival(row.departure, row.durationMinutes),
          arrivalTime: row.arrival,
          departureTime: null,
        },
      ],
    });
  }

  if (docs.length) {
    await Train.insertMany(docs, { ordered: false });
  }

  console.log(`Imported ${docs.length} trains (skipped ${rows.length - docs.length} already present).`);
  await mongoose.disconnect();
}

importTrains().catch((err) => {
  console.error('Import failed:', err.message);
  process.exit(1);
});
