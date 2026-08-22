import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

function StopwatchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 2h4" />
      <path d="M12 14v-4" />
      <circle cx="12" cy="14" r="8" />
      <path d="m19 5-1.5 1.5" />
    </svg>
  );
}

const CATEGORIES = ['AC', 'Sleeper'];

export default function TatkalExperience({ trainNumber, isDark }) {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [insight, setInsight] = useState({ AC: null, Sleeper: null });
  const [loading, setLoading] = useState(false);

  const [seatCategory, setSeatCategory] = useState('AC');
  const [minutes, setMinutes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const fetchInsight = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await client.get(`/tatkal-experience/${trainNumber}`);
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

  async function handleSubmit(e) {
    e.preventDefault();
    const value = Number(minutes);
    if (!minutes || !Number.isFinite(value) || value < 0 || value > 180 || submitting) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      await client.post('/tatkal-experience', { trainNumber, seatCategory, estimatedMinutesToSellOut: value });
      setMinutes('');
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
      await fetchInsight();
    } catch (err) {
      setSubmitError(err.response?.data?.message || t('tatkalExperience.submitError'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={`p-5 border-t ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
      <div className="flex items-center gap-2 mb-1">
        <span
          className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
            isDark ? 'bg-amber-500/15 text-amber-300' : 'bg-amber-100 text-amber-600'
          }`}
        >
          <StopwatchIcon />
        </span>
        <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t('tatkalExperience.title')}</h3>
      </div>
      <p className={`text-xs mb-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
        {t('tatkalExperience.description')}
      </p>

      <div className="grid sm:grid-cols-2 gap-2.5 mb-3.5">
        {CATEGORIES.map((cat) => {
          const data = insight[cat];
          return (
            <div
              key={cat}
              className={`rounded-xl px-3.5 py-3 border ${
                isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className={`text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{cat}</div>
              {loading && <div className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{t('tatkalExperience.loading')}</div>}
              {!loading && data && (
                <>
                  <div className={`text-xl font-bold tabular-nums ${isDark ? 'text-amber-300' : 'text-amber-600'}`}>
                    {t('tatkalExperience.avgMinutes', { minutes: data.avgMinutes })}
                  </div>
                  <div className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    {t('tatkalExperience.estimateFromReports', { count: data.count })}
                  </div>
                </>
              )}
              {!loading && !data && (
                <div className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  {t('tatkalExperience.noReports')}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!user && (
        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          <a href="/login" className={isDark ? 'text-orange-300 underline' : 'text-orange-600 underline'}>
            {t('tatkalExperience.loginPrompt')}
          </a>{' '}
          {t('tatkalExperience.loginToShare')}
        </p>
      )}

      {user && (
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
          <div className="flex rounded-xl overflow-hidden border border-slate-200 flex-shrink-0" style={isDark ? { borderColor: 'rgba(255,255,255,0.1)' } : undefined}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSeatCategory(cat)}
                className={`px-3.5 py-2.5 text-sm font-medium transition-colors ${
                  seatCategory === cat
                    ? 'bg-amber-500 text-white'
                    : isDark
                    ? 'bg-white/5 text-slate-300 hover:bg-white/10'
                    : 'bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <input
            type="number"
            inputMode="numeric"
            min="0"
            max="180"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            placeholder={t('tatkalExperience.minutesPlaceholder')}
            className={`flex-1 min-w-0 rounded-xl px-3.5 py-2.5 text-sm border focus:outline-none focus:ring-2 focus:ring-orange-400 ${
              isDark
                ? 'bg-white/5 border-white/10 text-slate-100 placeholder:text-slate-500'
                : 'bg-white border-slate-300 text-slate-800 placeholder:text-slate-400'
            }`}
          />
          <motion.button
            type="submit"
            disabled={!minutes || submitting}
            className="flex-shrink-0 text-sm font-semibold px-4 py-2.5 rounded-xl text-white bg-gradient-to-br from-amber-500 to-orange-500 shadow-md shadow-amber-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? t('tatkalExperience.submitting') : submitted ? t('tatkalExperience.submitted') : t('tatkalExperience.submit')}
          </motion.button>
        </form>
      )}
      {submitError && <p className="text-xs text-red-400 mt-2">{submitError}</p>}
    </div>
  );
}
