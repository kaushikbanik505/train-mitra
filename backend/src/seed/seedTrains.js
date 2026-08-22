require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Train = require('../models/Train');

// No real timetable data available; times are estimated from an average speed per
// train category plus a fixed halt at each intermediate stop, not scraped/real IRCTC data.
function classify(trainName) {
  const n = trainName.toLowerCase();
  if (n.includes('vande bharat')) return { speedKmph: 90, haltMin: 2 };
  if (n.includes('rajdhani')) return { speedKmph: 85, haltMin: 3 };
  if (n.includes('shatabdi')) return { speedKmph: 85, haltMin: 2 };
  if (n.includes('duronto')) return { speedKmph: 80, haltMin: 2 };
  if (n.includes('garib rath')) return { speedKmph: 70, haltMin: 4 };
  if (n.includes('jan shatabdi') || n.includes('intercity')) return { speedKmph: 65, haltMin: 3 };
  return { speedKmph: 55, haltMin: 5 }; // Mail/Express and everything else
}

// Deterministic per-train origin departure time so re-seeding is reproducible.
function originDepartureMinutes(trainNumber) {
  const num = parseInt(trainNumber, 10) || 0;
  const hour = (num % 20) + 4; // 04:00 - 23:xx
  const minute = (Math.round(((num * 7) % 60) / 5) * 5) % 60;
  return hour * 60 + minute;
}

function formatClock(totalMinutes) {
  const m = ((totalMinutes % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

function train(trainNumber, trainName, routeStops) {
  const { speedKmph, haltMin } = classify(trainName);
  const originMinutes = originDepartureMinutes(trainNumber);
  let runningHalt = 0;

  const stops = routeStops.map(([stationName, stationCode, distanceKm], i) => {
    const isOrigin = i === 0;
    const isLast = i === routeStops.length - 1;
    const travelMinutes = Math.round((distanceKm / speedKmph) * 60);
    const elapsed = isOrigin ? 0 : travelMinutes + runningHalt;
    const arrivalTime = isOrigin ? null : formatClock(originMinutes + elapsed);
    const departureTime = isLast ? null : formatClock(originMinutes + elapsed + (isOrigin ? 0 : haltMin));

    if (!isOrigin && !isLast) runningHalt += haltMin;

    return {
      sequence: i + 1,
      stationName,
      stationCode: stationCode.toUpperCase(),
      distanceKm,
      dayOfJourney: 1 + Math.floor((originMinutes + elapsed) / 1440),
      arrivalTime,
      departureTime,
    };
  });
  return {
    trainNumber,
    trainName,
    origin: { stationName: stops[0].stationName, stationCode: stops[0].stationCode },
    destination: { stationName: stops[stops.length - 1].stationName, stationCode: stops[stops.length - 1].stationCode },
    stops,
  };
}

// Defines one route in the "up" direction; auto-generates the reverse "down" train
// by reversing stop order and recomputing distances from the new origin.
function pair(numUp, numDown, name, routeStops) {
  const total = routeStops[routeStops.length - 1][2];
  const downStops = [...routeStops].reverse().map(([n, c, km]) => [n, c, total - km]);
  return [train(numUp, name, routeStops), train(numDown, name, downStops)];
}

const routePairs = [
  // Rajdhani Express
  pair('12301', '12302', 'Howrah Rajdhani Express', [
    ['Howrah Jn', 'HWH', 0], ['Dhanbad Jn', 'DHN', 259], ['Gaya Jn', 'GAYA', 470],
    ['Pt Deen Dayal Upadhyaya Jn', 'DDU', 610], ['Kanpur Central', 'CNB', 1000], ['New Delhi', 'NDLS', 1447],
  ]),
  pair('12951', '12952', 'Mumbai Rajdhani Express', [
    ['Mumbai Central', 'MMCT', 0], ['Surat', 'ST', 263], ['Vadodara Jn', 'BRC', 392],
    ['Ratlam Jn', 'RTM', 691], ['Kota Jn', 'KOTA', 939], ['New Delhi', 'NDLS', 1384],
  ]),
  pair('12953', '12954', 'August Kranti Rajdhani Express', [
    ['Mumbai Central', 'MMCT', 0], ['Surat', 'ST', 263], ['Vadodara Jn', 'BRC', 392],
    ['Kota Jn', 'KOTA', 939], ['Hazrat Nizamuddin', 'NZM', 1384],
  ]),
  pair('12309', '12310', 'Rajendra Nagar Rajdhani Express', [
    ['Rajendra Nagar Terminal', 'RJPB', 0], ['Danapur', 'DNR', 10], ['Buxar', 'BXR', 110],
    ['Pt Deen Dayal Upadhyaya Jn', 'DDU', 225], ['Kanpur Central', 'CNB', 615], ['New Delhi', 'NDLS', 995],
  ]),
  pair('12313', '12314', 'Sealdah Rajdhani Express', [
    ['Sealdah', 'SDAH', 0], ['Asansol Jn', 'ASN', 215], ['Dhanbad Jn', 'DHN', 280],
    ['Gaya Jn', 'GAYA', 491], ['Kanpur Central', 'CNB', 1021], ['New Delhi', 'NDLS', 1447],
  ]),
  pair('12423', '12424', 'Dibrugarh Rajdhani Express', [
    ['Dibrugarh', 'DBRG', 0], ['Guwahati', 'GHY', 480], ['New Jalpaiguri', 'NJP', 870],
    ['Patna Jn', 'PNBE', 1500], ['Kanpur Central', 'CNB', 1980], ['New Delhi', 'NDLS', 2438],
  ]),
  pair('12425', '12426', 'Jammu Rajdhani Express', [
    ['Jammu Tawi', 'JAT', 0], ['Pathankot Jn', 'PTK', 105], ['Ludhiana Jn', 'LDH', 280],
    ['Ambala Cantt', 'UMB', 400], ['New Delhi', 'NDLS', 581],
  ]),
  pair('12429', '12430', 'Bangalore Rajdhani Express', [
    ['KSR Bengaluru', 'SBC', 0], ['Guntakal Jn', 'GTL', 415], ['Secunderabad Jn', 'SC', 740],
    ['Nagpur Jn', 'NGP', 1420], ['Bhopal Jn', 'BPL', 1830], ['Hazrat Nizamuddin', 'NZM', 2365],
  ]),
  pair('12431', '12432', 'Trivandrum Rajdhani Express', [
    ['Thiruvananthapuram Central', 'TVC', 0], ['Ernakulam Jn', 'ERS', 220], ['Coimbatore Jn', 'CBE', 440],
    ['Chennai Central', 'MAS', 860], ['Nagpur Jn', 'NGP', 2100], ['Hazrat Nizamuddin', 'NZM', 3149],
  ]),
  pair('12433', '12434', 'Chennai Rajdhani Express', [
    ['Chennai Central', 'MAS', 0], ['Vijayawada Jn', 'BZA', 430], ['Nagpur Jn', 'NGP', 1180],
    ['Bhopal Jn', 'BPL', 1590], ['Hazrat Nizamuddin', 'NZM', 2180],
  ]),

  // Shatabdi Express
  pair('12001', '12002', 'Bhopal Shatabdi Express', [
    ['New Delhi', 'NDLS', 0], ['Agra Cantt', 'AGC', 188], ['Gwalior Jn', 'GWL', 307],
    ['Jhansi Jn', 'JHS', 403], ['Bhopal Jn', 'BPL', 701],
  ]),
  pair('12003', '12004', 'Lucknow Shatabdi Express', [
    ['New Delhi', 'NDLS', 0], ['Kanpur Central', 'CNB', 440], ['Lucknow Charbagh', 'LKO', 511],
  ]),
  pair('12005', '12006', 'Kalka Shatabdi Express', [
    ['New Delhi', 'NDLS', 0], ['Ambala Cantt', 'UMB', 200], ['Chandigarh', 'CDG', 245], ['Kalka', 'KLK', 296],
  ]),
  pair('12009', '12010', 'Shatabdi Express', [
    ['Mumbai Central', 'MMCT', 0], ['Surat', 'ST', 263], ['Vadodara Jn', 'BRC', 392], ['Ahmedabad Jn', 'ADI', 493],
  ]),
  pair('12027', '12028', 'Shatabdi Express', [
    ['Chennai Central', 'MAS', 0], ['Jolarpettai Jn', 'JTJ', 210], ['Bangarpet', 'BWT', 300], ['KSR Bengaluru', 'SBC', 362],
  ]),
  pair('12029', '12030', 'Swarna Shatabdi Express', [
    ['New Delhi', 'NDLS', 0], ['Ambala Cantt', 'UMB', 200], ['Ludhiana Jn', 'LDH', 310],
    ['Jalandhar City', 'JUC', 370], ['Amritsar Jn', 'ASR', 448],
  ]),

  // Duronto Express
  pair('12273', '12274', 'Howrah Duronto Express', [
    ['Howrah Jn', 'HWH', 0], ['Pt Deen Dayal Upadhyaya Jn', 'DDU', 610], ['New Delhi', 'NDLS', 1447],
  ]),
  pair('12259', '12260', 'Sealdah Duronto Express', [
    ['Sealdah', 'SDAH', 0], ['Asansol Jn', 'ASN', 215], ['Kanpur Central', 'CNB', 1021], ['New Delhi', 'NDLS', 1447],
  ]),
  pair('12283', '12284', 'Ernakulam Duronto Express', [
    ['Ernakulam Jn', 'ERS', 0], ['Coimbatore Jn', 'CBE', 220], ['Chennai Central', 'MAS', 640],
    ['Nagpur Jn', 'NGP', 1880], ['Hazrat Nizamuddin', 'NZM', 2650],
  ]),
  pair('12213', '12214', 'Yesvantpur Duronto Express', [
    ['Yesvantpur Jn', 'YPR', 0], ['Guntakal Jn', 'GTL', 415], ['Bhopal Jn', 'BPL', 1900], ['Hazrat Nizamuddin', 'NZM', 2444],
  ]),

  // Vande Bharat Express
  pair('22439', '22440', 'Vande Bharat Express', [
    ['New Delhi', 'NDLS', 0], ['Kanpur Central', 'CNB', 440], ['Prayagraj Jn', 'PRYJ', 633], ['Varanasi Jn', 'BSBS', 771],
  ]),
  pair('22435', '22436', 'Vande Bharat Express', [
    ['New Delhi', 'NDLS', 0], ['Ambala Cantt', 'UMB', 200], ['Jammu Tawi', 'JAT', 581],
    ['Shri Mata Vaishno Devi Katra', 'SVDK', 655],
  ]),
  pair('20901', '20902', 'Vande Bharat Express', [
    ['Mumbai Central', 'MMCT', 0], ['Surat', 'ST', 263], ['Vadodara Jn', 'BRC', 392],
    ['Ahmedabad Jn', 'ADI', 493], ['Gandhinagar Capital', 'GNC', 522],
  ]),
  pair('22221', '22222', 'Vande Bharat Express', [
    ['Chennai Central', 'MAS', 0], ['Jolarpettai Jn', 'JTJ', 210], ['KSR Bengaluru', 'SBC', 362], ['Mysuru Jn', 'MYS', 497],
  ]),

  // Iconic Mail / Express / Superfast
  pair('12621', '12622', 'Tamil Nadu Express', [
    ['New Delhi', 'NDLS', 0], ['Bhopal Jn', 'BPL', 701], ['Nagpur Jn', 'NGP', 1091],
    ['Vijayawada Jn', 'BZA', 1750], ['Chennai Central', 'MAS', 2180],
  ]),
  pair('12625', '12626', 'Kerala Express', [
    ['New Delhi', 'NDLS', 0], ['Bhopal Jn', 'BPL', 701], ['Nagpur Jn', 'NGP', 1091],
    ['Chennai Central', 'MAS', 2320], ['Coimbatore Jn', 'CBE', 2760], ['Thiruvananthapuram Central', 'TVC', 3043],
  ]),
  pair('12723', '12724', 'Telangana Express', [
    ['New Delhi', 'NDLS', 0], ['Gwalior Jn', 'GWL', 307], ['Bhopal Jn', 'BPL', 701],
    ['Nagpur Jn', 'NGP', 1091], ['Secunderabad Jn', 'SC', 1671],
  ]),
  pair('12137', '12138', 'Punjab Mail', [
    ['Mumbai CSMT', 'CSMT', 0], ['Vadodara Jn', 'BRC', 493], ['Kota Jn', 'KOTA', 739],
    ['New Delhi', 'NDLS', 1184], ['Ludhiana Jn', 'LDH', 1420], ['Firozpur Cantt', 'FZR', 1587],
  ]),
  pair('12615', '12616', 'Grand Trunk Express', [
    ['Hazrat Nizamuddin', 'NZM', 0], ['Bhopal Jn', 'BPL', 590], ['Nagpur Jn', 'NGP', 980],
    ['Vijayawada Jn', 'BZA', 1650], ['Chennai Central', 'MAS', 2194],
  ]),
  pair('12839', '12840', 'Howrah Chennai Mail', [
    ['Howrah Jn', 'HWH', 0], ['Bhubaneswar', 'BBS', 443], ['Visakhapatnam', 'VSKP', 873],
    ['Vijayawada Jn', 'BZA', 1103], ['Chennai Central', 'MAS', 1663],
  ]),
  pair('12859', '12860', 'Gitanjali Express', [
    ['Howrah Jn', 'HWH', 0], ['Kharagpur Jn', 'KGP', 116], ['Nagpur Jn', 'NGP', 1180],
    ['Pune Jn', 'PUNE', 1750], ['Mumbai CSMT', 'CSMT', 1968],
  ]),
  pair('12841', '12842', 'Coromandel Express', [
    ['Howrah Jn', 'HWH', 0], ['Bhubaneswar', 'BBS', 443], ['Vijayawada Jn', 'BZA', 1103], ['Chennai Central', 'MAS', 1663],
  ]),
  pair('12627', '12628', 'Karnataka Express', [
    ['New Delhi', 'NDLS', 0], ['Bhopal Jn', 'BPL', 701], ['Nagpur Jn', 'NGP', 1091],
    ['Guntakal Jn', 'GTL', 1830], ['KSR Bengaluru', 'SBC', 2444],
  ]),
  pair('12903', '12904', 'Golden Temple Mail', [
    ['Amritsar Jn', 'ASR', 0], ['New Delhi', 'NDLS', 448], ['Kota Jn', 'KOTA', 933],
    ['Vadodara Jn', 'BRC', 1434], ['Mumbai CSMT', 'CSMT', 1927],
  ]),
  pair('12925', '12926', 'Paschim Express', [
    ['Amritsar Jn', 'ASR', 0], ['New Delhi', 'NDLS', 448], ['Kota Jn', 'KOTA', 933],
    ['Vadodara Jn', 'BRC', 1434], ['Mumbai Bandra Terminus', 'BDTS', 1886],
  ]),
  pair('12123', '12124', 'Deccan Queen', [
    ['Mumbai CSMT', 'CSMT', 0], ['Lonavala', 'LNL', 128], ['Pune Jn', 'PUNE', 192],
  ]),
  pair('12049', '12050', 'Gatimaan Express', [
    ['Hazrat Nizamuddin', 'NZM', 0], ['Agra Cantt', 'AGC', 188],
  ]),
  pair('12801', '12802', 'Purushottam Express', [
    ['New Delhi', 'NDLS', 0], ['Pt Deen Dayal Upadhyaya Jn', 'DDU', 759], ['Dhanbad Jn', 'DHN', 900],
    ['Kharagpur Jn', 'KGP', 1250], ['Bhubaneswar', 'BBS', 1817],
  ]),
  pair('12639', '12640', 'Brindavan Express', [
    ['Chennai Central', 'MAS', 0], ['Jolarpettai Jn', 'JTJ', 210], ['KSR Bengaluru', 'SBC', 362],
  ]),
  pair('12695', '12696', 'Kovai Express', [
    ['Chennai Central', 'MAS', 0], ['Salem Jn', 'SA', 340], ['Erode Jn', 'ED', 400], ['Coimbatore Jn', 'CBE', 497],
  ]),
  pair('12633', '12634', 'Vaigai Express', [
    ['Chennai Central', 'MAS', 0], ['Tiruchirapalli Jn', 'TPJ', 330], ['Madurai Jn', 'MDU', 444],
  ]),
  pair('16127', '16128', 'Chennai Trivandrum Mail', [
    ['Chennai Central', 'MAS', 0], ['Coimbatore Jn', 'CBE', 497], ['Ernakulam Jn', 'ERS', 650],
    ['Thiruvananthapuram Central', 'TVC', 726],
  ]),
  pair('19019', '19020', 'Dehradun Express', [
    ['Mumbai Bandra Terminus', 'BDTS', 0], ['Vadodara Jn', 'BRC', 493], ['Kota Jn', 'KOTA', 739],
    ['New Delhi', 'NDLS', 1184], ['Haridwar Jn', 'HW', 1420], ['Dehradun', 'DDN', 1508],
  ]),
  pair('12471', '12472', 'Swaraj Express', [
    ['Mumbai Bandra Terminus', 'BDTS', 0], ['Vadodara Jn', 'BRC', 493], ['Kota Jn', 'KOTA', 933],
    ['New Delhi', 'NDLS', 1438], ['Amritsar Jn', 'ASR', 1886],
  ]),
  pair('12875', '12876', 'Neelachal Express', [
    ['New Delhi', 'NDLS', 0], ['Pt Deen Dayal Upadhyaya Jn', 'DDU', 759], ['Kharagpur Jn', 'KGP', 1250],
    ['Bhubaneswar', 'BBS', 1817], ['Puri', 'PURI', 1837],
  ]),
  pair('12295', '12296', 'Sanghamitra Express', [
    ['KSR Bengaluru', 'SBC', 0], ['Guntakal Jn', 'GTL', 415], ['Secunderabad Jn', 'SC', 740],
    ['Nagpur Jn', 'NGP', 1420], ['Gaya Jn', 'GAYA', 1950], ['Patna Jn', 'PNBE', 2098],
  ]),
  pair('12649', '12650', 'Karnataka Sampark Kranti Express', [
    ['KSR Bengaluru', 'SBC', 0], ['Guntakal Jn', 'GTL', 415], ['Secunderabad Jn', 'SC', 740],
    ['Bhopal Jn', 'BPL', 1830], ['Hazrat Nizamuddin', 'NZM', 2365],
  ]),
  pair('10103', '10104', 'Mandovi Express', [
    ['Mumbai CSMT', 'CSMT', 0], ['Ratnagiri', 'RN', 354], ['Madgaon Jn', 'MAO', 581],
  ]),
  pair('12051', '12052', 'Jan Shatabdi Express', [
    ['Mumbai CSMT', 'CSMT', 0], ['Panvel Jn', 'PNVL', 60], ['Ratnagiri', 'RN', 354], ['Madgaon Jn', 'MAO', 581],
  ]),
  pair('11301', '11302', 'Udyan Express', [
    ['Mumbai CSMT', 'CSMT', 0], ['Pune Jn', 'PUNE', 192], ['Guntakal Jn', 'GTL', 700], ['KSR Bengaluru', 'SBC', 1180],
  ]),
];

// Trains with real published stop-level timings (verified against public timetables),
// unlike routePairs above where times are computed estimates. Built directly rather
// than via train()/pair() so the real arrival/departure/day values aren't overwritten
// by the speed-based estimator.
function realTrain(trainNumber, trainName, stops) {
  const stopDocs = stops.map(([stationName, stationCode, distanceKm, dayOfJourney, arrivalTime, departureTime], i) => ({
    sequence: i + 1,
    stationName,
    stationCode: stationCode.toUpperCase(),
    distanceKm,
    dayOfJourney,
    arrivalTime,
    departureTime,
  }));
  return {
    trainNumber,
    trainName,
    origin: { stationName: stopDocs[0].stationName, stationCode: stopDocs[0].stationCode },
    destination: { stationName: stopDocs[stopDocs.length - 1].stationName, stationCode: stopDocs[stopDocs.length - 1].stationCode },
    stops: stopDocs,
  };
}

const realTrains = [
  realTrain('13173', 'Kanchanjungha Express', [
    ['Kolkata Sealdah', 'SDAH', 0, 1, null, '06:50'],
    ['New Jalpaiguri', 'NJP', 567, 1, '17:55', '18:05'],
    ['Guwahati', 'GHY', 975, 2, '02:40', '02:50'],
    ['Lumding Jn', 'LMG', 1156, 2, '06:20', '06:35'],
    ['Badarpur Jn', 'BPB', 1325, 2, '12:10', '12:20'],
    ['Agartala', 'AGTL', 1546, 2, '17:25', '17:40'],
    ['Sabroom', 'SBRM', 1659, 2, '21:10', null],
  ]),
  realTrain('13174', 'Kanchanjungha Express', [
    ['Sabroom', 'SBRM', 0, 1, null, '06:10'],
    ['Agartala', 'AGTL', 113, 1, '07:50', '08:05'],
    ['Badarpur Jn', 'BPB', 334, 1, '12:50', '13:00'],
    ['Lumding Jn', 'LMG', 503, 1, '18:20', '18:35'],
    ['Guwahati', 'GHY', 684, 1, '22:25', '22:35'],
    ['New Jalpaiguri', 'NJP', 1092, 2, '07:25', '07:35'],
    ['Kolkata Sealdah', 'SDAH', 1659, 2, '19:20', null],
  ]),
];

const trains = [...routePairs.flat(), ...realTrains];

async function seed() {
  await connectDB();
  await Train.deleteMany({});
  await Train.insertMany(trains);
  console.log(`Seeded ${trains.length} trains.`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seeding failed:', err.message);
  process.exit(1);
});
