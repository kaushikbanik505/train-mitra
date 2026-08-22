// Indian Railways app - "today" always means the current date in India (IST, UTC+5:30),
// regardless of what timezone the server itself happens to run in.
function todayIST() {
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  const shifted = new Date(Date.now() + IST_OFFSET_MS);
  return shifted.toISOString().slice(0, 10);
}

module.exports = { todayIST };
