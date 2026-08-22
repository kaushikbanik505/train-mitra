import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import client from '../api/client';
import socket from '../socket';
import useTrainRoom from '../hooks/useTrainRoom';
import { useAuth } from '../context/AuthContext';
import { enqueue } from '../offline/offlineQueue';
import TrustBadge from './TrustBadge';

function mergeReport(reports, incoming) {
  const exists = reports.some((r) => r._id === incoming._id);
  const next = exists ? reports.map((r) => (r._id === incoming._id ? incoming : r)) : [incoming, ...reports];
  return next.sort((a, b) => b.upvotes - b.downvotes - (a.upvotes - a.downvotes));
}

function MegaphoneIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 11 18-5v12L3 13v-2Z" />
      <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
    </svg>
  );
}

function ThumbUpIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 10v12" />
      <path d="M15 5.88 14 10h6.29a2 2 0 0 1 1.94 2.5l-2.34 9A2 2 0 0 1 18 23H7a2 2 0 0 1-2-2v-9a2 2 0 0 1 .59-1.41L11 5a2 2 0 0 1 3 1.71z" />
    </svg>
  );
}

function ThumbDownIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 14V2" />
      <path d="M9 18.12 10 14H3.71a2 2 0 0 1-1.94-2.5l2.34-9A2 2 0 0 1 6 1h11a2 2 0 0 1 2 2v9a2 2 0 0 1-.59 1.41L13 19a2 2 0 0 1-3-1.71z" />
    </svg>
  );
}

function todayDateInput() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function DelayReports({ trainNumber, isDark }) {
  const { t } = useTranslation();
  const { user } = useAuth();

  const journeyDate = todayDateInput();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [queuedOffline, setQueuedOffline] = useState(false);

  const [votingId, setVotingId] = useState(null);
  const [quota, setQuota] = useState(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const { data } = await client.get(`/delay-reports/${trainNumber}`);
      setReports(data);
    } catch {
      setLoadError(t('delayReports.loadError'));
    } finally {
      setLoading(false);
    }
  }, [trainNumber, t]);

  const fetchQuota = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await client.get('/delay-reports/quota');
      setQuota(data);
    } catch {
      // Quota display is a nice-to-have; a failed fetch just leaves it hidden.
    }
  }, [user]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  useEffect(() => {
    fetchQuota();
  }, [fetchQuota]);

  useTrainRoom(trainNumber, journeyDate);

  useEffect(() => {
    function onNewReport(payload) {
      if (payload.trainNumber !== trainNumber) return;
      setReports((prev) => mergeReport(prev, payload));
    }
    function onVoteUpdated(payload) {
      if (payload.trainNumber !== trainNumber) return;
      setReports((prev) => mergeReport(prev, payload));
    }
    socket.on('new_delay_report', onNewReport);
    socket.on('vote_updated', onVoteUpdated);
    return () => {
      socket.off('new_delay_report', onNewReport);
      socket.off('vote_updated', onVoteUpdated);
    };
  }, [trainNumber]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!reason.trim() || submitting) return;
    setSubmitting(true);
    setSubmitError('');
    setQueuedOffline(false);
    const payload = { trainNumber, reason: reason.trim() };
    try {
      await client.post('/delay-reports', payload);
      setReason('');
      await fetchReports();
    } catch (err) {
      if (!err.response) {
        // No response at all means the request never reached the network, not a
        // rejection from the server - queue it instead of showing an error.
        await enqueue({ endpoint: '/delay-reports', payload, label: t('delayReports.title') });
        setReason('');
        setQueuedOffline(true);
      } else {
        setSubmitError(err.response?.data?.message || t('delayReports.submitError'));
      }
    } finally {
      setSubmitting(false);
      fetchQuota();
    }
  }

  async function handleVote(reportId, voteType) {
    if (votingId) return;
    setVotingId(reportId);
    try {
      const { data } = await client.post(`/delay-reports/${reportId}/vote`, { voteType });
      setReports((prev) =>
        prev
          .map((r) => (r._id === reportId ? data : r))
          .sort((a, b) => b.upvotes - b.downvotes - (a.upvotes - a.downvotes))
      );
    } catch {
      // Vote failures are non-critical (e.g. a stale double-click) - silently ignore.
    } finally {
      setVotingId(null);
    }
  }

  const isBlocked = quota?.blocked;
  const quotaExhausted = quota && quota.remaining <= 0 && !isBlocked;

  return (
    <div className={`p-5 border-t ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
      <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
        <div className="flex items-center gap-2">
          <span
            className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
              isDark ? 'bg-rose-500/15 text-rose-300' : 'bg-rose-100 text-rose-600'
            }`}
          >
            <MegaphoneIcon />
          </span>
          <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t('delayReports.title')}</h3>
        </div>
        {user && quota && !isBlocked && (
          <span
            className={`text-[11px] font-semibold px-2.5 py-1 rounded-full tabular-nums ${
              quota.remaining <= 2
                ? isDark
                  ? 'bg-amber-500/15 text-amber-300'
                  : 'bg-amber-100 text-amber-700'
                : isDark
                ? 'bg-white/10 text-slate-300'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {t('delayReports.leftToday', { count: quota.remaining })}
          </span>
        )}
      </div>
      <p className={`text-xs mb-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
        {t('delayReports.resetNote')}
      </p>

      {loading && <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('delayReports.loading')}</p>}
      {!loading && loadError && <p className="text-xs text-red-400">{loadError}</p>}
      {!loading && !loadError && reports.length === 0 && (
        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          {t('delayReports.empty')}
        </p>
      )}

      {!loading && reports.length > 0 && (
        <ul className="space-y-2 mb-4">
          <AnimatePresence initial={false}>
            {reports.map((r) => {
              const myVote = user ? r.votedBy?.find((v) => v.userId === user.id)?.voteType : null;
              const isOwn = user && r.reportedBy?._id === user.id;
              const net = r.upvotes - r.downvotes;
              return (
                <motion.li
                  key={r._id}
                  layout
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`rounded-xl px-3.5 py-2.5 border flex items-start gap-3 ${
                    isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{r.reason}</p>
                    <p className={`text-[11px] mt-0.5 flex items-center gap-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      <span>
                        {r.reportedBy?.name || t('delayReports.someone')}
                        {isOwn && t('delayReports.you')}
                      </span>
                      <TrustBadge reputationScore={r.reportedBy?.reputationScore} isDark={isDark} title={t('delayReports.trustedContributor')} />
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      type="button"
                      disabled={!user || votingId === r._id}
                      onClick={() => handleVote(r._id, 'up')}
                      aria-label={t('delayReports.upvote')}
                      className={`w-9 h-9 sm:w-7 sm:h-7 rounded-full flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                        myVote === 'up'
                          ? 'bg-emerald-500 text-white'
                          : isDark
                          ? 'bg-white/10 text-slate-300 hover:bg-white/20'
                          : 'bg-white text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 border border-slate-200'
                      }`}
                    >
                      <ThumbUpIcon />
                    </button>
                    <span className={`text-xs font-semibold tabular-nums w-5 text-center ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      {net}
                    </span>
                    <button
                      type="button"
                      disabled={!user || votingId === r._id}
                      onClick={() => handleVote(r._id, 'down')}
                      aria-label={t('delayReports.downvote')}
                      className={`w-9 h-9 sm:w-7 sm:h-7 rounded-full flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                        myVote === 'down'
                          ? 'bg-rose-500 text-white'
                          : isDark
                          ? 'bg-white/10 text-slate-300 hover:bg-white/20'
                          : 'bg-white text-slate-500 hover:bg-rose-50 hover:text-rose-600 border border-slate-200'
                      }`}
                    >
                      <ThumbDownIcon />
                    </button>
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}

      {!user && (
        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          <a href="/login" className={isDark ? 'text-orange-300 underline' : 'text-orange-600 underline'}>
            {t('delayReports.loginPrompt')}
          </a>{' '}
          {t('delayReports.loginToPost')}
        </p>
      )}

      {user && isBlocked && (
        <p className="text-xs text-rose-400">
          {t('delayReports.blocked')}
        </p>
      )}

      {user && !isBlocked && quotaExhausted && (
        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          {t('delayReports.quotaExhausted', { limit: quota.limit })}
        </p>
      )}

      {user && !isBlocked && !quotaExhausted && (
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t('delayReports.reasonPlaceholder')}
            maxLength={300}
            className={`flex-1 min-w-0 rounded-xl px-3.5 py-2.5 text-sm border focus:outline-none focus:ring-2 focus:ring-orange-400 ${
              isDark
                ? 'bg-white/5 border-white/10 text-slate-100 placeholder:text-slate-500'
                : 'bg-white border-slate-200 text-slate-800 placeholder:text-slate-400'
            }`}
          />
          <button
            type="submit"
            disabled={!reason.trim() || submitting}
            className="flex-shrink-0 text-sm font-semibold px-4 py-2.5 rounded-xl text-white bg-gradient-to-br from-orange-500 to-amber-500 shadow-md shadow-orange-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? t('delayReports.submitting') : t('delayReports.submit')}
          </button>
        </form>
      )}
      {submitError && <p className="text-xs text-red-400 mt-2">{submitError}</p>}
      {queuedOffline && <p className={`text-xs mt-2 ${isDark ? 'text-amber-300' : 'text-amber-600'}`}>{t('delayReports.queuedOffline')}</p>}
    </div>
  );
}
