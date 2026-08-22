import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

function SparkleIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" />
    </svg>
  );
}

function StarIcon({ filled, half }) {
  if (half) {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24">
        <defs>
          <linearGradient id="starHalf">
            <stop offset="50%" stopColor="currentColor" />
            <stop offset="50%" stopColor="transparent" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2Z"
          fill="url(#starHalf)"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
      <path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2Z" />
    </svg>
  );
}

function StarDisplay({ value, colorClass }) {
  const rounded = Math.round((value || 0) * 2) / 2;
  return (
    <span className={`inline-flex items-center gap-0.5 ${colorClass}`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <StarIcon key={n} filled={rounded >= n} half={rounded + 0.5 === n} />
      ))}
    </span>
  );
}

function StarInput({ value, onChange, colorClass }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <span className={`inline-flex items-center gap-0.5 ${colorClass}`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          aria-label={`Rate ${n} out of 5`}
          className="p-0.5 transition-transform hover:scale-110"
        >
          <StarIcon filled={shown >= n} />
        </button>
      ))}
    </span>
  );
}

function timeAgo(isoString, t) {
  const seconds = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (seconds < 60) return t('journeyExperience.justNow');
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return t('journeyExperience.minutesAgo', { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t('journeyExperience.hoursAgo', { count: hours });
  const days = Math.floor(hours / 24);
  if (days < 30) return t('journeyExperience.daysAgo', { count: days });
  const months = Math.floor(days / 30);
  return t('journeyExperience.monthsAgo', { count: months });
}

const CATEGORY_KEYS = ['cleanliness', 'food', 'staffBehaviour', 'punctuality', 'safety'];

const EMPTY_RATINGS = { cleanliness: 0, food: 0, staffBehaviour: 0, punctuality: 0, safety: 0 };

export default function JourneyExperience({ trainNumber, isDark }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const CATEGORIES = CATEGORY_KEYS.map((key) => ({ key, label: t(`journeyExperience.categories.${key}`) }));

  const [insight, setInsight] = useState({ averages: null, recentComments: [] });
  const [loading, setLoading] = useState(false);

  const [ratings, setRatings] = useState(EMPTY_RATINGS);
  const [comment, setComment] = useState('');
  const [hasExisting, setHasExisting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const fetchInsight = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await client.get(`/journey-experience/${trainNumber}`);
      setInsight(data);
    } catch {
      // Insight is a nice-to-have summary; a failed fetch just leaves it empty.
    } finally {
      setLoading(false);
    }
  }, [trainNumber]);

  useEffect(() => {
    fetchInsight();
  }, [fetchInsight]);

  useEffect(() => {
    if (!user) {
      setRatings(EMPTY_RATINGS);
      setComment('');
      setHasExisting(false);
      return;
    }
    let cancelled = false;
    client.get(`/journey-experience/${trainNumber}/mine`).then(({ data }) => {
      if (cancelled) return;
      if (data) {
        setRatings({
          cleanliness: data.cleanliness,
          food: data.food,
          staffBehaviour: data.staffBehaviour,
          punctuality: data.punctuality,
          safety: data.safety,
        });
        setComment(data.comment || '');
        setHasExisting(true);
      } else {
        setRatings(EMPTY_RATINGS);
        setComment('');
        setHasExisting(false);
      }
    }).catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [trainNumber, user]);

  const allRated = CATEGORIES.every((c) => ratings[c.key] > 0);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!allRated || submitting) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      await client.post('/journey-experience', { trainNumber, ...ratings, comment });
      setHasExisting(true);
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
      await fetchInsight();
    } catch (err) {
      setSubmitError(err.response?.data?.message || t('journeyExperience.submitError'));
    } finally {
      setSubmitting(false);
    }
  }

  const { averages, recentComments } = insight;

  return (
    <div className={`p-5 border-t ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
      <div className="flex items-center gap-2 mb-1">
        <span
          className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
            isDark ? 'bg-teal-500/15 text-teal-300' : 'bg-teal-100 text-teal-600'
          }`}
        >
          <SparkleIcon />
        </span>
        <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t('journeyExperience.title')}</h3>
        {averages && (
          <span className={`ml-auto flex items-center gap-1.5 text-xs font-semibold ${isDark ? 'text-teal-300' : 'text-teal-600'}`}>
            <StarDisplay value={averages.overall} colorClass={isDark ? 'text-teal-300' : 'text-teal-500'} />
            {averages.overall}
          </span>
        )}
      </div>
      <p className={`text-xs mb-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
        {t('journeyExperience.description')}
      </p>

      {loading && <div className={`text-xs mb-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{t('journeyExperience.loading')}</div>}

      {!loading && !averages && (
        <div className={`text-xs mb-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          {t('journeyExperience.noRatings')}
        </div>
      )}

      {!loading && averages && (
        <div className="grid sm:grid-cols-2 gap-2.5 mb-3.5">
          {CATEGORIES.map((c) => (
            <div
              key={c.key}
              className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 border ${
                isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <span className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{c.label}</span>
              <span className="flex items-center gap-1.5">
                <StarDisplay value={averages[c.key]} colorClass={isDark ? 'text-teal-300' : 'text-teal-500'} />
                <span className={`text-xs font-semibold tabular-nums ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                  {averages[c.key]}
                </span>
              </span>
            </div>
          ))}
          <div className={`text-[11px] sm:col-span-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            {t('journeyExperience.basedOnRatings', { count: averages.count })}
          </div>
        </div>
      )}

      {recentComments?.length > 0 && (
        <div className="mb-3.5 space-y-2">
          {recentComments.map((c, i) => (
            <div
              key={i}
              className={`rounded-xl px-3.5 py-2.5 border text-xs ${
                isDark ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{c.name}</span>
                <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>{timeAgo(c.createdAt, t)}</span>
              </div>
              <p className="whitespace-pre-wrap break-words">{c.comment}</p>
            </div>
          ))}
        </div>
      )}

      {!user && (
        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          <a href="/login" className={isDark ? 'text-orange-300 underline' : 'text-orange-600 underline'}>
            {t('journeyExperience.loginPrompt')}
          </a>{' '}
          {t('journeyExperience.loginToRate')}
        </p>
      )}

      {user && (
        <form onSubmit={handleSubmit} className="space-y-2.5">
          <div className={`grid sm:grid-cols-2 gap-2 rounded-xl p-3 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
            {CATEGORIES.map((c) => (
              <div key={c.key} className="flex items-center justify-between gap-2">
                <span className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{c.label}</span>
                <StarInput
                  value={ratings[c.key]}
                  onChange={(n) => setRatings((r) => ({ ...r, [c.key]: n }))}
                  colorClass={isDark ? 'text-teal-300' : 'text-teal-500'}
                />
              </div>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value.slice(0, 300))}
            rows={2}
            placeholder={t('journeyExperience.commentPlaceholder')}
            className={`w-full rounded-xl px-3.5 py-2.5 text-sm border resize-none focus:outline-none focus:ring-2 focus:ring-teal-400 ${
              isDark
                ? 'bg-white/5 border-white/10 text-slate-100 placeholder:text-slate-500'
                : 'bg-white border-slate-300 text-slate-800 placeholder:text-slate-400'
            }`}
          />
          <div className="flex items-center justify-between gap-2">
            <span className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{comment.length}/300</span>
            <motion.button
              type="submit"
              disabled={!allRated || submitting}
              className="flex-shrink-0 text-sm font-semibold px-4 py-2.5 rounded-xl text-white bg-gradient-to-br from-teal-500 to-emerald-500 shadow-md shadow-teal-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting
                ? t('journeyExperience.submitting')
                : submitted
                ? t('journeyExperience.submitted')
                : hasExisting
                ? t('journeyExperience.update')
                : t('journeyExperience.submit')}
            </motion.button>
          </div>
        </form>
      )}
      {submitError && <p className="text-xs text-red-400 mt-2">{submitError}</p>}
    </div>
  );
}
