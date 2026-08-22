import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import client from '../api/client';
import { TrainIcon } from '../components/TrainTrack';
import SkyBackground, { skyTheme } from '../components/SkyBackground';
import DelayReports from '../components/DelayReports';
import LiveStatusFeed from '../components/LiveStatusFeed';
import TatkalExperience from '../components/TatkalExperience';
import JourneyExperience from '../components/JourneyExperience';
import useTimeOfDay from '../hooks/useTimeOfDay';

const POPULAR_TRAINS = [
  { number: '12951', label: 'Mumbai Rajdhani' },
  { number: '12301', label: 'Howrah Rajdhani' },
  { number: '12001', label: 'Bhopal Shatabdi' },
  { number: '12273', label: 'Howrah Duronto' },
];

const POPULAR_ROUTES = [
  { from: { stationName: 'New Delhi', stationCode: 'NDLS' }, to: { stationName: 'Mumbai Central', stationCode: 'MMCT' } },
  { from: { stationName: 'Howrah Jn', stationCode: 'HWH' }, to: { stationName: 'New Delhi', stationCode: 'NDLS' } },
  { from: { stationName: 'Chennai Central', stationCode: 'MAS' }, to: { stationName: 'KSR Bengaluru', stationCode: 'SBC' } },
  { from: { stationName: 'Agartala', stationCode: 'AGTL' }, to: { stationName: 'Sealdah', stationCode: 'SDAH' } },
];

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function ChevronIcon({ open }) {
  return (
    <motion.svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      animate={{ rotate: open ? 180 : 0 }}
      transition={{ duration: 0.2 }}
    >
      <path d="m6 9 6 6 6-6" />
    </motion.svg>
  );
}

function SwapIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="rotate-90 sm:rotate-0"
    >
      <path d="M7 16V4M7 4 3 8M7 4l4 4" />
      <path d="M17 8v12M17 20l4-4M17 20l-4-4" />
    </svg>
  );
}

function OriginDotIcon() {
  return (
    <span className="relative flex-shrink-0 flex items-center justify-center w-4 h-4">
      <span className="absolute w-4 h-4 rounded-full bg-orange-200 animate-ping-slow" />
      <span className="relative w-2 h-2 rounded-full bg-orange-500" />
    </span>
  );
}

function DestinationPinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-orange-500 flex-shrink-0">
      <path d="M12 2C7.86 2 4.5 5.36 4.5 9.5c0 5.71 6.5 12 7 12.46a.75.75 0 0 0 1 0c.5-.46 7-6.75 7-12.46C19.5 5.36 16.14 2 12 2zm0 10.5a3 3 0 1 1 0-6 3 3 0 0 1 0 6z" />
    </svg>
  );
}

function TicketIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2z" />
      <path d="M13 5v2M13 11v2M13 17v2" />
    </svg>
  );
}

function MegaphoneIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 11 18-5v12L3 13v-2Z" />
      <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

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

function ClockIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <path d="M15 3h6v6" />
      <path d="M10 14 21 3" />
    </svg>
  );
}

function TrainDot() {
  return (
    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center text-xs">
      🚆
    </span>
  );
}

function formatDuration(mins) {
  if (mins == null || Number.isNaN(mins)) return '';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
}

// Tatkal opens daily at a fixed clock time; the next opening is just "the next time
// this hour occurs" - today if it hasn't passed yet, otherwise tomorrow.
function nextTatkalOpening(now, hour) {
  const next = new Date(now);
  next.setHours(hour, 0, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  return next;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDateLabel(date) {
  return date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

function formatCountdown(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = String(Math.floor(total / 3600)).padStart(2, '0');
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
  const s = String(total % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

function StationField({ label, placeholder, value, onSelect, disabledCode, icon, dark }) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef(null);
  const wrapRef = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const { data } = await client.get('/trains/stations/search', { params: { q: query.trim() } });
        if (!cancelled) setResults(data.filter((s) => s.stationCode !== disabledCode));
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(debounceRef.current);
    };
  }, [query, disabledCode]);

  function handleSelect(station) {
    onSelect(station);
    setQuery('');
    setResults([]);
    setOpen(false);
  }

  function handleChange(e) {
    setQuery(e.target.value);
    setOpen(true);
    if (value) onSelect(null);
  }

  return (
    <div ref={wrapRef} className="relative flex-1 min-w-0 group">
      <label className={`block text-xs font-semibold mb-1.5 tracking-wide uppercase ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
        {label}
      </label>
      <div
        className={`relative rounded-xl overflow-hidden border transition-shadow group-focus-within:ring-2 group-focus-within:ring-orange-400 group-focus-within:border-orange-400 group-focus-within:shadow-[0_0_16px_rgba(251,146,60,0.22)] ${
          dark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'
        }`}
      >
        <div className="absolute inset-0 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-orange-100/40 to-transparent animate-input-shimmer" />
        </div>
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">{icon}</span>
        <input
          type="text"
          value={value ? `${value.stationName} (${value.stationCode})` : query}
          onChange={handleChange}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className={`relative w-full bg-transparent pl-10 pr-3.5 py-3 text-sm font-medium focus:outline-none truncate ${
            dark ? 'text-slate-100 placeholder:text-slate-500' : 'text-slate-800 placeholder:text-slate-400'
          }`}
        />
      </div>
      <AnimatePresence>
        {open && query.trim() && !value && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className={`themed-scrollbar absolute z-20 mt-1.5 w-full rounded-xl shadow-lg max-h-56 overflow-y-auto overflow-x-hidden border ${
              dark ? 'bg-slate-900/95 backdrop-blur border-white/10' : 'bg-white border-slate-200'
            }`}
          >
            {loading && <div className={`px-3.5 py-2.5 text-sm ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{t('trainSearch.searchingStations')}</div>}
            {!loading && results.length === 0 && (
              <div className={`px-3.5 py-2.5 text-sm ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{t('trainSearch.noStationsFound')}</div>
            )}
            {!loading &&
              results.map((s) => (
                <button
                  key={s.stationCode}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelect(s)}
                  className={`w-full text-left px-3.5 py-2.5 text-sm border-b last:border-0 transition-colors ${
                    dark ? 'hover:bg-white/5 border-white/5' : 'hover:bg-orange-50 border-slate-100'
                  }`}
                >
                  <span className={`font-medium ${dark ? 'text-slate-100' : 'text-slate-800'}`}>{s.stationName}</span>{' '}
                  <span className={`font-mono text-xs ${dark ? 'text-slate-500' : 'text-slate-400'}`}>({s.stationCode})</span>
                </button>
              ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const ENTRY_BANNER_META = {
  tatkal: { accent: 'orange', Icon: TicketIcon },
  delay: { accent: 'rose', Icon: MegaphoneIcon },
  live: { accent: 'indigo', Icon: SatelliteIcon },
  experience: { accent: 'teal', Icon: ChatIcon },
};

export default function TrainSearch() {
  const { t } = useTranslation();
  const period = useTimeOfDay();
  const reduceMotion = useReducedMotion();
  const isDark = skyTheme[period].isDark;

  const [searchParams] = useSearchParams();
  const cameFromTatkal = searchParams.get('tatkal') === '1';
  const cameFromDelay = searchParams.get('delay') === '1';
  const cameFromLive = searchParams.get('live') === '1';
  const cameFromExperience = searchParams.get('experience') === '1';

  const entryVariant = cameFromTatkal
    ? 'tatkal'
    : cameFromDelay
    ? 'delay'
    : cameFromLive
    ? 'live'
    : cameFromExperience
    ? 'experience'
    : 'plain';

  const headline = t(`trainSearch.headline.${entryVariant}`, { returnObjects: true });
  const emptyStateHint = t(`trainSearch.emptyStateHint.${entryVariant}`, { returnObjects: true });
  const entryBanner =
    entryVariant === 'plain'
      ? null
      : {
          ...ENTRY_BANNER_META[entryVariant],
          title: t(`trainSearch.entryBanner.${entryVariant}.title`),
          body: t(`trainSearch.entryBanner.${entryVariant}.body`),
        };

  const ENTRY_BANNER_STYLES = {
    orange: {
      wrap: isDark ? 'bg-orange-500/10 border-orange-400/30' : 'bg-orange-50 border-orange-200',
      icon: isDark ? 'bg-orange-500/20 text-orange-300' : 'bg-orange-100 text-orange-600',
      text: isDark ? 'text-orange-100' : 'text-orange-900',
    },
    rose: {
      wrap: isDark ? 'bg-rose-500/10 border-rose-400/30' : 'bg-rose-50 border-rose-200',
      icon: isDark ? 'bg-rose-500/20 text-rose-300' : 'bg-rose-100 text-rose-600',
      text: isDark ? 'text-rose-100' : 'text-rose-900',
    },
    indigo: {
      wrap: isDark ? 'bg-indigo-500/10 border-indigo-400/30' : 'bg-indigo-50 border-indigo-200',
      icon: isDark ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-100 text-indigo-600',
      text: isDark ? 'text-indigo-100' : 'text-indigo-900',
    },
    teal: {
      wrap: isDark ? 'bg-teal-500/10 border-teal-400/30' : 'bg-teal-50 border-teal-200',
      icon: isDark ? 'bg-teal-500/20 text-teal-300' : 'bg-teal-100 text-teal-600',
      text: isDark ? 'text-teal-100' : 'text-teal-900',
    },
  };

  const [mode, setMode] = useState('train');

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const debounceRef = useRef(null);
  const detailRef = useRef(null);

  useEffect(() => {
    if (selected) {
      detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selected]);

  const [fromStation, setFromStation] = useState(null);
  const [toStation, setToStation] = useState(null);
  const [routeResults, setRouteResults] = useState([]);
  const [routeExact, setRouteExact] = useState(true);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeSearched, setRouteSearched] = useState(false);
  const [routeError, setRouteError] = useState('');

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    if (!selected) return;
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, [selected]);

  // Switching between nav destinations (Track Trains / Tatkal / Delay Reports / Live
  // Status) all land on this same route with just a different query string, so React
  // Router doesn't remount this page - without this, whatever train was open on the
  // previous destination stayed open on the new one instead of starting fresh.
  const entryKey = `${cameFromTatkal}${cameFromDelay}${cameFromLive}${cameFromExperience}`;
  useEffect(() => {
    setSelected(null);
    setQuery('');
    setResults([]);
    setFromStation(null);
    setToStation(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entryKey]);

  useEffect(() => {
    clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const { data } = await client.get('/trains/search', { params: { q: query.trim() } });
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  useEffect(() => {
    if (!fromStation || !toStation) {
      setRouteResults([]);
      setRouteSearched(false);
      setRouteError('');
      return;
    }

    let cancelled = false;
    setRouteLoading(true);
    setRouteSearched(true);
    setRouteError('');

    client
      .get('/trains/route', { params: { from: fromStation.stationCode, to: toStation.stationCode } })
      .then(({ data }) => {
        if (!cancelled) {
          setRouteResults(data.results);
          setRouteExact(data.exact);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setRouteResults([]);
          setRouteExact(true);
          setRouteError(err.response?.data?.message || 'Route search failed.');
        }
      })
      .finally(() => {
        if (!cancelled) setRouteLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [fromStation, toStation]);

  async function selectTrain(trainNumber) {
    setResults([]);
    setQuery('');
    try {
      const { data } = await client.get(`/trains/${trainNumber}`);
      setSelected(data);
      setCollapsed(false);
    } catch {
      setSelected(null);
    }
  }

  const [swapRotation, setSwapRotation] = useState(0);

  function swapStations() {
    setFromStation(toStation);
    setToStation(fromStation);
    setSwapRotation((r) => r + 180);
  }

  function switchMode(next) {
    setMode(next);
    setSelected(null);
  }

  const showTrainEmptyState = mode === 'train' && !selected && !query.trim();
  const showRouteEmptyState = mode === 'route' && !selected && !fromStation && !toStation;

  return (
    <div
      className={`relative min-h-[calc(100vh-57px)] overflow-hidden bg-gradient-to-b transition-colors duration-1000 px-4 py-10 ${skyTheme[period].gradient}`}
    >
      <SkyBackground period={period} reduceMotion={reduceMotion} />

      {!isDark && (
        <>
          <div className="pointer-events-none absolute -top-24 -left-24 w-80 h-80 rounded-full bg-orange-300/40 blur-3xl" />
          <div className="pointer-events-none absolute top-1/3 -right-24 w-80 h-80 rounded-full bg-amber-300/35 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-1/4 w-72 h-72 rounded-full bg-sky-200/30 blur-3xl" />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.4]"
            style={{
              backgroundImage: 'radial-gradient(circle, #fdba74 1px, transparent 1px)',
              backgroundSize: '28px 28px',
              maskImage: 'radial-gradient(ellipse 70% 60% at 50% 0%, black 0%, transparent 70%)',
              WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 0%, black 0%, transparent 70%)',
            }}
          />
        </>
      )}

      <div className="relative max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center sm:text-left mb-6"
        >
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full mb-3 ${
              isDark ? 'text-orange-200 bg-white/10' : 'text-orange-700 bg-orange-100'
            }`}
          >
            {t('trainSearch.badge')}
          </span>
          <h1 className={`text-3xl sm:text-4xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {headline.before}
            <span className={isDark ? 'text-orange-400' : 'text-orange-500'}>{headline.word}</span>
            {headline.after}
          </h1>
          <p className={`text-sm sm:text-base ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            {mode === 'train' ? t('trainSearch.subtitle.train') : t('trainSearch.subtitle.route')}
          </p>
        </motion.div>

        {entryBanner && !selected && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 }}
            className={`flex items-start gap-3 rounded-2xl px-4 py-3.5 mb-5 border ${ENTRY_BANNER_STYLES[entryBanner.accent].wrap}`}
          >
            <span
              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${ENTRY_BANNER_STYLES[entryBanner.accent].icon}`}
            >
              <entryBanner.Icon />
            </span>
            <p className={`text-sm ${ENTRY_BANNER_STYLES[entryBanner.accent].text}`}>
              <strong>{entryBanner.title}</strong> {t('trainSearch.entryBanner.middle')}{' '}
              {entryBanner.body}
            </p>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className={`inline-flex rounded-full p-1 mb-6 mx-auto sm:mx-0 shadow-inner ${isDark ? 'bg-white/10' : 'bg-slate-100'}`}
        >
          {[
            { key: 'train', label: t('trainSearch.tabs.byTrain') },
            { key: 'route', label: t('trainSearch.tabs.byRoute') },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => switchMode(tab.key)}
              className="relative px-5 py-2 rounded-full text-xs font-semibold"
            >
              {mode === tab.key && (
                <motion.span
                  layoutId="mode-tab-pill"
                  className={`absolute inset-0 rounded-full shadow-sm ${isDark ? 'bg-white/15' : 'bg-white'}`}
                  transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                />
              )}
              <span
                className={`relative z-10 transition-colors ${
                  mode === tab.key
                    ? isDark
                      ? 'text-orange-300'
                      : 'text-orange-600'
                    : isDark
                    ? 'text-slate-300 hover:text-white'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.label}
              </span>
            </button>
          ))}
        </motion.div>

        {mode === 'train' && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className={`group relative rounded-2xl p-[1.5px] shadow-lg shadow-orange-500/5 transition-colors bg-gradient-to-br group-focus-within:from-orange-400 group-focus-within:to-amber-400 ${
              isDark ? 'from-white/20 via-white/10 to-white/20' : 'from-orange-200 via-slate-200 to-amber-200'
            }`}
          >
            <div
              className={`relative rounded-[15px] overflow-hidden group-focus-within:shadow-[0_0_20px_rgba(251,146,60,0.25)] transition-shadow ${
                isDark ? 'bg-slate-900/80 backdrop-blur-sm' : 'bg-white'
              }`}
            >
              <div className="absolute inset-0 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none">
                <div className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-orange-100/40 to-transparent animate-input-shimmer" />
              </div>
              <span className={`absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none ${isDark ? 'text-orange-300' : 'text-orange-400'}`}>
                <SearchIcon />
              </span>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('trainSearch.searchPlaceholder')}
                className={`relative w-full bg-transparent pl-11 pr-11 py-4 text-base font-medium focus:outline-none ${
                  isDark ? 'text-slate-100 placeholder:text-slate-500' : 'text-slate-800 placeholder:text-slate-400'
                }`}
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label={t('trainSearch.clearSearch')}
                  className={`absolute right-4 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <XIcon />
                </button>
              )}
            </div>

            <AnimatePresence>
              {query.trim() && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className={`absolute z-10 mt-2 w-full rounded-2xl shadow-lg overflow-hidden border ${
                    isDark ? 'bg-slate-900/95 backdrop-blur border-white/10' : 'bg-white border-slate-200'
                  }`}
                >
                  {loading && (
                    <div className={`px-4 py-3 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('trainSearch.searching')}</div>
                  )}
                  {!loading && results.length === 0 && (
                    <div className={`px-4 py-3 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('trainSearch.noTrainsFound')}</div>
                  )}
                  {!loading &&
                    results.map((t) => (
                      <button
                        key={t.trainNumber}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => selectTrain(t.trainNumber)}
                        className={`w-full flex items-center gap-3 text-left px-4 py-3 border-b last:border-0 transition-colors ${
                          isDark ? 'hover:bg-white/5 border-white/5' : 'hover:bg-orange-50 border-slate-100'
                        }`}
                      >
                        <TrainDot />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-mono text-xs px-1.5 py-0.5 rounded ${
                                isDark ? 'bg-white/10 text-slate-200' : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {t.trainNumber}
                            </span>
                            <span className={`text-sm font-medium truncate ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                              {t.trainName}
                            </span>
                          </div>
                          <div className={`text-xs mt-0.5 truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {t.origin.stationName} ({t.origin.stationCode}) &rarr; {t.destination.stationName} ({t.destination.stationCode})
                          </div>
                        </div>
                      </button>
                    ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {mode === 'route' && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className={`relative rounded-2xl p-[1.5px] shadow-lg shadow-orange-500/5 bg-gradient-to-br ${
              isDark ? 'from-white/20 via-white/10 to-white/20' : 'from-orange-200 via-slate-200 to-amber-200'
            }`}
          >
            <div
              className={`relative flex flex-col sm:flex-row items-stretch sm:items-end gap-3 rounded-[15px] p-4 ${
                isDark ? 'bg-slate-900/80 backdrop-blur-sm' : 'bg-white'
              }`}
            >
              <div className="absolute inset-0 rounded-[15px] overflow-hidden pointer-events-none">
                <div
                  className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl ${
                    isDark ? 'bg-orange-500/10' : 'bg-orange-100/60'
                  }`}
                />
              </div>

              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.15 }}
                className="flex-1 min-w-0 relative z-10"
              >
                <StationField
                  label={t('trainSearch.from')}
                  placeholder={t('trainSearch.fromPlaceholder')}
                  value={fromStation}
                  onSelect={setFromStation}
                  disabledCode={toStation?.stationCode}
                  icon={<OriginDotIcon />}
                  dark={isDark}
                />
              </motion.div>

              <motion.button
                type="button"
                onClick={swapStations}
                aria-label={t('trainSearch.swapStations')}
                animate={{ rotate: swapRotation }}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                className="relative z-10 flex-shrink-0 self-center sm:mb-1 w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/30 flex items-center justify-center"
              >
                <SwapIcon />
              </motion.button>

              <motion.div
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="flex-1 min-w-0 relative z-10"
              >
                <StationField
                  label={t('trainSearch.to')}
                  placeholder={t('trainSearch.toPlaceholder')}
                  value={toStation}
                  onSelect={setToStation}
                  disabledCode={fromStation?.stationCode}
                  icon={<DestinationPinIcon />}
                  dark={isDark}
                />
              </motion.div>
            </div>
          </motion.div>
        )}

        {mode === 'train' && !selected && !query.trim() && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="mt-4 flex flex-wrap items-center gap-2 justify-center sm:justify-start"
          >
            <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('trainSearch.popular')}</span>
            {POPULAR_TRAINS.map((t) => (
              <motion.button
                key={t.number}
                onClick={() => selectTrain(t.number)}
                whileHover={{ y: -2, scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border shadow-sm transition-colors ${
                  isDark
                    ? 'bg-white/5 border-white/10 text-slate-300 hover:border-orange-400/50 hover:text-orange-300'
                    : 'bg-white border-slate-200 hover:border-orange-300 hover:shadow-md hover:text-orange-600'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-br from-orange-400 to-amber-500" />
                {t.number} &middot; {t.label}
              </motion.button>
            ))}
          </motion.div>
        )}

        {mode === 'route' && !fromStation && !toStation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="mt-4 flex flex-wrap items-center gap-2 justify-center sm:justify-start"
          >
            <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('trainSearch.popular')}</span>
            {POPULAR_ROUTES.map((r) => (
              <motion.button
                key={`${r.from.stationCode}-${r.to.stationCode}`}
                onClick={() => {
                  setFromStation(r.from);
                  setToStation(r.to);
                }}
                whileHover={{ y: -2, scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border shadow-sm transition-colors ${
                  isDark
                    ? 'bg-white/5 border-white/10 text-slate-300 hover:border-orange-400/50 hover:text-orange-300'
                    : 'bg-white border-slate-200 hover:border-orange-300 hover:shadow-md hover:text-orange-600'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-br from-orange-400 to-amber-500" />
                {r.from.stationCode} &rarr; {r.to.stationCode}
              </motion.button>
            ))}
          </motion.div>
        )}

        {mode === 'route' && (
          <div className="mt-4">
            {routeLoading && <div className={`text-sm px-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('trainSearch.searchingTrains')}</div>}
            {!routeLoading && routeError && <div className="text-sm text-red-400 px-1">{routeError}</div>}
            {!routeLoading && !routeError && routeSearched && routeResults.length === 0 && (
              <div className={`text-sm px-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {t('trainSearch.noDirectTrains')}
              </div>
            )}
            {!routeLoading && !routeExact && routeResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mb-3 flex items-start gap-2 text-xs rounded-xl px-3.5 py-2.5 border ${
                  isDark ? 'text-amber-200 bg-amber-500/10 border-amber-400/30' : 'text-amber-800 bg-amber-50 border-amber-200'
                }`}
              >
                <span className="flex-shrink-0">ℹ️</span>
                <span>
                  {t('trainSearch.noDirectTrainNote', { from: fromStation?.stationName, to: toStation?.stationName })}
                </span>
              </motion.div>
            )}
            {!routeLoading && routeResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="space-y-2.5"
              >
                {routeResults.map((r) => (
                  <motion.button
                    key={r.trainNumber}
                    type="button"
                    onClick={() => selectTrain(r.trainNumber)}
                    whileHover={{ y: -2 }}
                    className={`w-full text-left rounded-2xl shadow-sm hover:shadow-md transition-all p-4 border ${
                      isDark
                        ? 'bg-white/5 border-white/10 hover:border-orange-400/40'
                        : 'bg-white border-slate-200 hover:border-orange-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className={`font-mono text-xs px-1.5 py-0.5 rounded ${
                          isDark ? 'bg-white/10 text-slate-200' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {r.trainNumber}
                      </span>
                      <span className={`text-sm font-semibold truncate ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                        {r.trainName}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{r.from.departureTime}</div>
                        <div className={`text-xs truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {r.from.stationName} &middot; {t('trainSearch.day', { day: r.from.dayOfJourney })}
                        </div>
                      </div>
                      <div className="flex-1 flex flex-col items-center px-2 min-w-[4rem]">
                        <span className={`text-[10px] mb-1 whitespace-nowrap ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                          {formatDuration(r.durationMinutes)}
                        </span>
                        <div className={`w-full h-px relative ${isDark ? 'bg-white/20' : 'bg-slate-200'}`}>
                          <span className="absolute -top-[5px] left-0 w-2.5 h-2.5 rounded-full bg-orange-400" />
                          <span className="absolute -top-[5px] right-0 w-2.5 h-2.5 rounded-full bg-orange-400" />
                        </div>
                      </div>
                      <div className="min-w-0 text-right">
                        <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{r.to.arrivalTime}</div>
                        <div className={`text-xs truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {r.to.stationName} &middot; {t('trainSearch.day', { day: r.to.dayOfJourney })}
                        </div>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </motion.div>
            )}
          </div>
        )}

        {(showTrainEmptyState || showRouteEmptyState) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="mt-16 flex flex-col items-center text-center"
          >
            <motion.div
              className={`relative flex items-center justify-center w-28 h-28 rounded-full shadow-inner bg-gradient-to-br ${
                isDark ? 'from-white/10 via-white/5 to-transparent' : 'from-orange-100 via-amber-50 to-orange-50'
              }`}
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div className={`absolute inset-0 rounded-full blur-xl ${isDark ? 'bg-orange-500/10' : 'bg-orange-200/40'}`} />
              <div className="relative scale-110">
                <TrainIcon />
              </div>
            </motion.div>
            <p className={`text-sm mt-5 max-w-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {mode === 'train' ? emptyStateHint.train : emptyStateHint.route}
            </p>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {selected && (
            <motion.div
              ref={detailRef}
              key={selected.trainNumber}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className={`mt-6 scroll-mt-24 rounded-2xl shadow-lg overflow-hidden border ${
                isDark ? 'bg-slate-900/80 backdrop-blur-sm border-white/10' : 'bg-white border-slate-200'
              }`}
            >
              <div
                className={`p-5 border-b bg-gradient-to-r ${
                  isDark ? 'from-orange-500/20 via-amber-500/10 to-transparent border-white/10' : 'from-orange-200 via-amber-100 to-orange-50 border-orange-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span
                        className={`font-mono text-xs px-1.5 py-0.5 rounded ${
                          isDark ? 'bg-orange-500/20 text-orange-300' : 'bg-orange-100 text-orange-700'
                        }`}
                      >
                        {selected.trainNumber}
                      </span>
                      <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{selected.trainName}</h2>
                    </div>
                    <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      {selected.origin.stationName} ({selected.origin.stationCode}) &rarr;{' '}
                      {selected.destination.stationName} ({selected.destination.stationCode})
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => setCollapsed((c) => !c)}
                      aria-label={collapsed ? t('trainSearch.expandRoute') : t('trainSearch.minimiseRoute')}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                        isDark ? 'bg-white/10 hover:bg-white/20 text-slate-300' : 'bg-white hover:bg-orange-100 text-slate-500 border border-slate-200'
                      }`}
                    >
                      <ChevronIcon open={!collapsed} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelected(null)}
                      aria-label={t('trainSearch.close')}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                        isDark ? 'bg-white/10 hover:bg-white/20 text-slate-300' : 'bg-white hover:bg-orange-100 text-slate-500 border border-slate-200'
                      }`}
                    >
                      <XIcon />
                    </button>
                  </div>
                </div>
              </div>

              {cameFromTatkal && (
                <div className={`p-5 border-b ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
                  <div className="flex items-center gap-2 mb-2.5">
                    <span
                      className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
                        isDark ? 'bg-orange-500/15 text-orange-300' : 'bg-orange-100 text-orange-600'
                      }`}
                    >
                      <TicketIcon />
                    </span>
                    <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t('trainSearch.tatkalBooking.title')}</h3>
                  </div>
                  <p className={`text-xs mb-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {t('trainSearch.tatkalBooking.body', { station: selected.origin.stationName, code: selected.origin.stationCode })}
                  </p>
                  <div className="grid sm:grid-cols-2 gap-2.5 mb-3.5">
                    {[
                      { hour: 10, label: t('trainSearch.tatkalBooking.acClasses') },
                      { hour: 11, label: t('trainSearch.tatkalBooking.sleeperSecond') },
                    ].map(({ hour, label }) => {
                      const opening = nextTatkalOpening(now, hour);
                      const journeyDate = addDays(opening, 1);
                      return (
                        <div
                          key={hour}
                          className={`rounded-xl px-3.5 py-3 border ${
                            isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 mb-2">
                            <span
                              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                                isDark ? 'bg-orange-500/15 text-orange-300' : 'bg-orange-100 text-orange-600'
                              }`}
                            >
                              <ClockIcon />
                            </span>
                            <div className="min-w-0">
                              <div className={`text-xs font-semibold truncate ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                                {label}
                              </div>
                              <div className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                {t('trainSearch.tatkalBooking.opensAt', { hour, ampm: 'AM', date: formatDateLabel(opening) })}
                              </div>
                            </div>
                          </div>
                          <div className={`font-mono text-xl font-bold tracking-wide tabular-nums ${isDark ? 'text-orange-300' : 'text-orange-600'}`}>
                            {formatCountdown(opening - now)}
                          </div>
                          <div className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                            {t('trainSearch.tatkalBooking.forJourneyOn', { date: formatDateLabel(journeyDate) })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <a
                    href="https://www.irctc.co.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl transition-colors ${
                      isDark ? 'bg-orange-500/15 text-orange-300 hover:bg-orange-500/25' : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                    }`}
                  >
                    {t('trainSearch.tatkalBooking.bookOnIrctc')}
                    <ExternalLinkIcon />
                  </a>
                </div>
              )}

              <AnimatePresence initial={false}>
                {!collapsed && (
                  <motion.div
                    key="stops"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="p-5">
                      <ol className={`relative border-l-2 ml-2 space-y-4 ${isDark ? 'border-orange-400/30' : 'border-orange-200'}`}>
                        {selected.stops.map((stop) => (
                          <li key={stop.sequence} className="ml-4">
                            <span
                              className={`absolute -left-[7px] mt-1.5 w-3 h-3 bg-orange-400 rounded-full border-2 shadow-sm ${
                                isDark ? 'border-slate-900' : 'border-white'
                              }`}
                            />
                            <div className="flex items-start justify-between gap-2">
                              <span className={`text-sm font-medium ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                                {stop.stationName}{' '}
                                <span className={`font-mono text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                  ({stop.stationCode})
                                </span>
                              </span>
                              <div className={`text-right text-xs whitespace-nowrap ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                <div>
                                  {stop.arrivalTime ? t('trainSearch.stops.arr', { time: stop.arrivalTime }) : t('trainSearch.stops.origin')}
                                  {stop.departureTime ? ` · ${t('trainSearch.stops.dep', { time: stop.departureTime })}` : ''}
                                </div>
                                <div className={isDark ? 'text-slate-500' : 'text-slate-400'}>
                                  {stop.distanceKm} km &middot; {t('trainSearch.day', { day: stop.dayOfJourney })}
                                </div>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {cameFromExperience && (
                <>
                  <TatkalExperience trainNumber={selected.trainNumber} isDark={isDark} />
                  <JourneyExperience trainNumber={selected.trainNumber} isDark={isDark} />
                </>
              )}
              {cameFromDelay && <DelayReports trainNumber={selected.trainNumber} isDark={isDark} />}
              {cameFromLive && (
                <LiveStatusFeed trainNumber={selected.trainNumber} stops={selected.stops} isDark={isDark} />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
