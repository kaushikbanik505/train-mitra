// Mirrors backend/src/utils/reputation.js's TRUSTED_REPUTATION_THRESHOLD - this one is
// purely a display cutoff (the backend never needs to know it), but keeping the same
// number avoids the two drifting apart silently.
export const TRUSTED_REPUTATION_THRESHOLD = 15;
