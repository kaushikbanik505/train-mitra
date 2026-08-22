import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import client from '../api/client';
import socket from '../socket';
import useTrainRoom from '../hooks/useTrainRoom';
import { useAuth } from '../context/AuthContext';
import { enqueue } from '../offline/offlineQueue';
import TrustBadge from './TrustBadge';

function SatelliteIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m13 7 4 4" />
      <path d="m5 19 3-3" />
      <path d="m14.5 4.5 1-1a2.12 2.12 0 0 1 3 3l-1 1" />
      <path d="m9.5 14.5-5 5" />
      <path d="m18.5 9.5 1-1a2.12 2.12 0 0 1 3 3l-1 1" />
      <path d="M8 12 3 17l4 4 5-5" />
      <path d="m4 21 1-1" />
    </svg>
  );
}

function ChevronIcon({ open }) {
  return (
    <motion.svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      animate={{ rotate: open ? 180 : 0 }}
      transition={{ duration: 0.2 }}
      className="flex-shrink-0"
    >
      <path d="m6 9 6 6 6-6" />
    </motion.svg>
  );
}

function PinIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" className="flex-shrink-0">
      <path d="M12 2C7.86 2 4.5 5.36 4.5 9.5c0 5.71 6.5 12 7 12.46a.75.75 0 0 0 1 0c.5-.46 7-6.75 7-12.46C19.5 5.36 16.14 2 12 2zm0 10.5a3 3 0 1 1 0-6 3 3 0 0 1 0 6z" />
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

function mergeUpdate(updates, incoming) {
  const exists = updates.some((u) => u._id === incoming._id);
  return exists ? updates.map((u) => (u._id === incoming._id ? incoming : u)) : [incoming, ...updates];
}

const PANEL_MAX_HEIGHT = 288;
const PANEL_GAP = 6;

function StationSelect({ stops, value, onChange, isDark }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState(null);
  const btnRef = useRef(null);
  const panelRef = useRef(null);

  function computeCoords() {
    const rect = btnRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openUpward = spaceBelow < PANEL_MAX_HEIGHT && spaceAbove > spaceBelow;
    setCoords({
      left: rect.left,
      width: rect.width,
      top: openUpward ? null : rect.bottom + PANEL_GAP,
      bottom: openUpward ? window.innerHeight - rect.top + PANEL_GAP : null,
      openUpward,
    });
  }

  function toggleOpen() {
    if (!open) computeCoords();
    setOpen((o) => !o);
  }

  useEffect(() => {
    if (!open) return undefined;
    function onClickOutside(e) {
      if (btnRef.current?.contains(e.target)) return;
      if (panelRef.current?.contains(e.target)) return;
      setOpen(false);
    }
    function onScrollOrResize(e) {
      // Scroll events from inside the panel's own scrollable list still reach here
      // (capture-phase listeners see them even though `scroll` doesn't bubble), and
      // don't need a reposition. Everything else (page scroll, window resize) repositions
      // the panel instead of closing it - closing on scroll caused a real bug: a click
      // that also nudges the page (e.g. browser scroll-into-view on focus) could fire a
      // deferred scroll event right after opening and close the panel before it was seen.
      if (panelRef.current?.contains(e.target)) return;
      computeCoords();
    }
    document.addEventListener('mousedown', onClickOutside);
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [open]);

  return (
    <div className="relative sm:w-52 flex-shrink-0">
      <button
        ref={btnRef}
        type="button"
        onClick={toggleOpen}
        className={`w-full flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm border transition-colors focus:outline-none focus:ring-2 focus:ring-orange-400 ${
          isDark ? 'bg-white/5 border-white/10 text-slate-100 hover:bg-white/10' : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
        }`}
      >
        <span className={isDark ? 'text-indigo-300' : 'text-indigo-500'}>
          <PinIcon />
        </span>
        <span className={`flex-1 min-w-0 text-left truncate ${!value ? (isDark ? 'text-slate-500' : 'text-slate-400') : ''}`}>
          {value || t('liveStatus.whereAreYou')}
        </span>
        <ChevronIcon open={open} />
      </button>
      {open &&
        coords &&
        createPortal(
          <AnimatePresence>
            <motion.div
              ref={panelRef}
              initial={{ opacity: 0, y: coords.openUpward ? 6 : -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{
                position: 'fixed',
                left: coords.left,
                width: coords.width,
                top: coords.top ?? undefined,
                bottom: coords.bottom ?? undefined,
                maxHeight: PANEL_MAX_HEIGHT,
              }}
              className={`themed-scrollbar z-50 rounded-xl shadow-lg overflow-y-auto border ${
                isDark ? 'bg-slate-900/95 backdrop-blur border-white/10' : 'bg-white border-slate-200'
              }`}
            >
              {stops.map((s) => (
                <button
                  key={s.stationCode}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onChange(s.stationName);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2.5 text-sm border-b last:border-0 transition-colors ${
                    s.stationName === value
                      ? isDark
                        ? 'bg-indigo-500/15 text-indigo-300'
                        : 'bg-indigo-50 text-indigo-700'
                      : isDark
                      ? 'text-slate-100 hover:bg-white/5 border-white/5'
                      : 'text-slate-800 hover:bg-indigo-50 border-slate-100'
                  }`}
                >
                  {s.stationName}{' '}
                  <span className={`font-mono text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>({s.stationCode})</span>
                </button>
              ))}
            </motion.div>
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
}

function todayDateInput() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function timeAgo(isoString, t) {
  const seconds = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (seconds < 60) return t('liveStatus.justNow');
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return t('liveStatus.minutesAgo', { count: minutes });
  const hours = Math.floor(minutes / 60);
  return t('liveStatus.hoursAgo', { count: hours });
}

export default function LiveStatusFeed({ trainNumber, stops, isDark }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const journeyDate = todayDateInput();

  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  const [stationName, setStationName] = useState('');
  const [platformNumber, setPlatformNumber] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [queuedOffline, setQueuedOffline] = useState(false);

  const [votingId, setVotingId] = useState(null);
  const [quota, setQuota] = useState(null);

  const fetchUpdates = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const { data } = await client.get(`/live-status/${trainNumber}`);
      setUpdates(data);
    } catch {
      setLoadError(t('liveStatus.loadError'));
    } finally {
      setLoading(false);
    }
  }, [trainNumber, t]);

  const fetchQuota = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await client.get('/live-status/quota');
      setQuota(data);
    } catch {
      // Quota display is a nice-to-have; a failed fetch just leaves it hidden.
    }
  }, [user]);

  useEffect(() => {
    fetchUpdates();
  }, [fetchUpdates]);

  useEffect(() => {
    fetchQuota();
  }, [fetchQuota]);

  useTrainRoom(trainNumber, journeyDate);

  useEffect(() => {
    function onUpdate(payload) {
      if (payload.trainNumber !== trainNumber) return;
      setUpdates((prev) => mergeUpdate(prev, payload));
    }
    function onVoteUpdated(payload) {
      if (payload.trainNumber !== trainNumber) return;
      setUpdates((prev) => mergeUpdate(prev, payload));
    }
    socket.on('live_status_update', onUpdate);
    socket.on('live_status_vote_updated', onVoteUpdated);
    return () => {
      socket.off('live_status_update', onUpdate);
      socket.off('live_status_vote_updated', onVoteUpdated);
    };
  }, [trainNumber]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!stationName || !message.trim() || submitting) return;
    setSubmitting(true);
    setSubmitError('');
    setQueuedOffline(false);
    const payload = {
      trainNumber,
      stationName,
      platformNumber: platformNumber.trim() || undefined,
      message: message.trim(),
    };
    try {
      await client.post('/live-status', payload);
      setMessage('');
      setPlatformNumber('');
    } catch (err) {
      if (!err.response) {
        await enqueue({ endpoint: '/live-status', payload, label: t('liveStatus.title') });
        setMessage('');
        setPlatformNumber('');
        setQueuedOffline(true);
      } else {
        setSubmitError(err.response?.data?.message || t('liveStatus.submitError'));
      }
    } finally {
      setSubmitting(false);
      fetchQuota();
    }
  }

  async function handleVote(updateId, voteType) {
    if (votingId) return;
    setVotingId(updateId);
    try {
      const { data } = await client.post(`/live-status/${updateId}/vote`, { voteType });
      setUpdates((prev) => prev.map((u) => (u._id === updateId ? data : u)));
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
              isDark ? 'bg-indigo-500/15 text-indigo-300' : 'bg-indigo-100 text-indigo-600'
            }`}
          >
            <SatelliteIcon />
          </span>
          <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t('liveStatus.title')}</h3>
          <span className="relative flex w-1.5 h-1.5 ml-0.5">
            <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping-slow" />
            <span className="relative w-1.5 h-1.5 rounded-full bg-emerald-500" />
          </span>
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
            {t('liveStatus.leftToday', { count: quota.remaining })}
          </span>
        )}
      </div>
      <p className={`text-xs mb-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
        {t('liveStatus.description')}
      </p>

      {loading && <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('liveStatus.loading')}</p>}
      {!loading && loadError && <p className="text-xs text-red-400">{loadError}</p>}
      {!loading && !loadError && updates.length === 0 && (
        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          {t('liveStatus.empty')}
        </p>
      )}

      {!loading && updates.length > 0 && (
        <ul className="space-y-2 mb-4">
          <AnimatePresence initial={false}>
            {updates.map((u) => {
              const myVote = user ? u.votedBy?.find((v) => v.userId === user.id)?.voteType : null;
              const net = u.upvotes - u.downvotes;
              return (
                <motion.li
                  key={u._id}
                  layout
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`rounded-xl px-3.5 py-2.5 border flex items-start gap-3 ${
                    isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          isDark ? 'bg-indigo-500/15 text-indigo-300' : 'bg-indigo-100 text-indigo-700'
                        }`}
                      >
                        {u.stationName}
                      </span>
                      {u.platformNumber && (
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                            isDark ? 'bg-emerald-500/15 text-emerald-300' : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          PF {u.platformNumber}
                        </span>
                      )}
                      <span className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{timeAgo(u.timestamp, t)}</span>
                    </div>
                    <p className={`text-sm ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{u.message}</p>
                    <p className={`text-[11px] mt-0.5 flex items-center gap-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      <span>{u.reportedBy?.name || t('liveStatus.someone')}</span>
                      <TrustBadge reputationScore={u.reportedBy?.reputationScore} isDark={isDark} title={t('liveStatus.trustedContributor')} />
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      type="button"
                      disabled={!user || votingId === u._id}
                      onClick={() => handleVote(u._id, 'up')}
                      aria-label={t('liveStatus.confirmAccurate')}
                      title={t('liveStatus.confirmAccurateTitle')}
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
                      disabled={!user || votingId === u._id}
                      onClick={() => handleVote(u._id, 'down')}
                      aria-label={t('liveStatus.reportFalse')}
                      title={t('liveStatus.reportFalseTitle')}
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
            {t('liveStatus.loginPrompt')}
          </a>{' '}
          {t('liveStatus.loginToPost')}
        </p>
      )}

      {user && isBlocked && (
        <p className="text-xs text-rose-400">
          {t('liveStatus.blocked')}
        </p>
      )}

      {user && !isBlocked && quotaExhausted && (
        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          {t('liveStatus.quotaExhausted', { limit: quota.limit })}
        </p>
      )}

      {user && !isBlocked && !quotaExhausted && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <div className="flex flex-col sm:flex-row gap-2">
            <StationSelect stops={stops} value={stationName} onChange={setStationName} isDark={isDark} />
            <input
              type="text"
              value={platformNumber}
              onChange={(e) => setPlatformNumber(e.target.value)}
              placeholder={t('liveStatus.platformPlaceholder')}
              maxLength={10}
              className={`sm:w-40 flex-shrink-0 rounded-xl px-3.5 py-2.5 text-sm border focus:outline-none focus:ring-2 focus:ring-orange-400 ${
                isDark
                  ? 'bg-white/5 border-white/10 text-slate-100 placeholder:text-slate-500'
                  : 'bg-white border-slate-300 text-slate-800 placeholder:text-slate-400'
              }`}
            />
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('liveStatus.messagePlaceholder')}
              maxLength={300}
              className={`flex-1 min-w-0 rounded-xl px-3.5 py-2.5 text-sm border focus:outline-none focus:ring-2 focus:ring-orange-400 ${
                isDark
                  ? 'bg-white/5 border-white/10 text-slate-100 placeholder:text-slate-500'
                  : 'bg-white border-slate-300 text-slate-800 placeholder:text-slate-400'
              }`}
            />
          </div>
          <button
            type="submit"
            disabled={!stationName || !message.trim() || submitting}
            className="self-start text-sm font-semibold px-4 py-2.5 rounded-xl text-white bg-gradient-to-br from-indigo-500 to-violet-500 shadow-md shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? t('liveStatus.submitting') : t('liveStatus.submit')}
          </button>
        </form>
      )}
      {submitError && <p className="text-xs text-red-400 mt-2">{submitError}</p>}
      {queuedOffline && <p className={`text-xs mt-2 ${isDark ? 'text-amber-300' : 'text-amber-600'}`}>{t('liveStatus.queuedOffline')}</p>}
    </div>
  );
}
