import { TRUSTED_REPUTATION_THRESHOLD } from '../constants/reputation';

function CheckBadgeIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="flex-shrink-0">
      <path d="M12 1 2.5 5v6.5c0 5.7 4 9.6 9.5 11.5 5.5-1.9 9.5-5.8 9.5-11.5V5L12 1Zm-1.4 15.4-4-4 1.4-1.4 2.6 2.6 6-6L18 9l-7.4 7.4Z" />
    </svg>
  );
}

// Shown next to a contributor's name once their persistent, cross-day reputation score
// (built from other people's votes on their reports/updates - see
// backend/src/utils/reputation.js) crosses the trust threshold.
export default function TrustBadge({ reputationScore, isDark, title }) {
  if (!reputationScore || reputationScore < TRUSTED_REPUTATION_THRESHOLD) return null;

  return (
    <span
      title={title}
      className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
        isDark ? 'bg-emerald-500/15 text-emerald-300' : 'bg-emerald-50 text-emerald-600'
      }`}
    >
      <CheckBadgeIcon />
    </span>
  );
}
