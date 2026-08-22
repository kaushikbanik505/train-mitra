import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { fileToResizedDataUrl } from '../utils/resizeImage';
import StationClock from './StationClock';
import DigitalClock from './DigitalClock';
import { TrainIcon } from './TrainTrack';
import { skyTheme } from './SkyBackground';
import useTimeOfDay from '../hooks/useTimeOfDay';

const scenePalette = {
  morning: { mountains: ['#94a3b8', '#a5b3c6', '#8f9fb5'], trees: ['#4ade80', '#6ee7a8'], rail: '#78716c', sleeper: '#94a3b8', cloud: '#e2e8f0' },
  noon: { mountains: ['#7c93ad', '#93a8c0', '#7791ab'], trees: ['#22c55e', '#4ade80'], rail: '#64748b', sleeper: '#94a3b8', cloud: '#ffffff' },
  evening: { mountains: ['#a3889b', '#b89aab', '#957c8c'], trees: ['#16a34a', '#22c55e'], rail: '#78716c', sleeper: '#c2410c', cloud: '#fed7aa' },
  night: { mountains: ['#334155', '#3f4a5f', '#2b3648'], trees: ['#065f46', '#047857'], rail: '#94a3b8', sleeper: '#475569', cloud: null },
};

function Cloud({ width = 30, top = 2, duration = 20, delay = 0, opacity = 0.4, color = '#cbd5e1' }) {
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{ top }}
      initial={{ left: '-20%' }}
      animate={{ left: '120%' }}
      transition={{ duration, repeat: Infinity, delay, ease: 'linear' }}
    >
      <svg width={width} height={width * 0.55} viewBox="0 0 44 24" style={{ opacity }}>
        <ellipse cx="12" cy="16" rx="10" ry="7" fill={color} />
        <ellipse cx="22" cy="10" rx="12" ry="9" fill={color} />
        <ellipse cx="33" cy="16" rx="9" ry="7" fill={color} />
        <rect x="6" y="14" width="32" height="8" rx="4" fill={color} />
      </svg>
    </motion.div>
  );
}

function Star({ left, top, delay }) {
  return (
    <motion.div
      className="absolute rounded-full bg-white pointer-events-none"
      style={{ left, top, width: 1.5, height: 1.5 }}
      animate={{ opacity: [0.2, 1, 0.2] }}
      transition={{ duration: 2 + Math.random() * 2, repeat: Infinity, delay, ease: 'easeInOut' }}
    />
  );
}

function Mountain({ left, width = 64, height = 30, color = '#cbd5e1', snow = false }) {
  const base = [0, height];
  const peak1 = [width * 0.38, height * 0.14];
  const dip = [width * 0.53, height * 0.53];
  const peak2 = [width * 0.69, height * 0.02];
  const end = [width, height];
  const snowTip = [
    [peak2[0], peak2[1]],
    [peak2[0] + width * 0.08, peak2[1] + height * 0.24],
    [peak2[0] - width * 0.08, peak2[1] + height * 0.24],
  ];

  return (
    <div className="absolute bottom-4 pointer-events-none" style={{ left }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <polygon
          points={`${base.join(',')} ${peak1.join(',')} ${dip.join(',')} ${peak2.join(',')} ${end.join(',')}`}
          fill={color}
        />
        {snow && <polygon points={snowTip.map((p) => p.join(',')).join(' ')} fill="#f1f5f9" />}
      </svg>
    </div>
  );
}

function Waterfall({ left, height = 14 }) {
  return (
    <div className="absolute bottom-4 pointer-events-none overflow-hidden" style={{ left, width: 5, height }}>
      {[0, 1].map((i) => (
        <motion.div
          key={i}
          className="absolute left-1/2 -translate-x-1/2 w-[1.5px] bg-sky-300/80 rounded-full"
          style={{ height: 5 }}
          initial={{ top: -5 }}
          animate={{ top: height }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.3, ease: 'linear' }}
        />
      ))}
      <motion.div
        className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-2.5 h-[3px] bg-sky-200/60 rounded-full"
        animate={{ opacity: [0.5, 0.9, 0.5] }}
        transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

function Tree({ left, size = 16, color = '#4ade80' }) {
  return (
    <div className="absolute bottom-4 pointer-events-none" style={{ left }}>
      <svg width={size} height={size * 1.4} viewBox="0 0 16 22">
        <polygon points="8,0 13,8 3,8" fill={color} />
        <polygon points="8,5 14,13 2,13" fill={color} />
        <polygon points="8,10 15,19 1,19" fill={color} />
        <rect x="6.5" y="18" width="3" height="4" fill="#78350f" />
      </svg>
    </div>
  );
}

function StreetLight({ left, lit }) {
  return (
    <div className="absolute bottom-4 pointer-events-none flex flex-col items-center" style={{ left }}>
      <div className="relative flex items-center justify-center" style={{ width: 14, height: 14 }}>
        {lit && (
          <motion.div
            className="absolute rounded-full"
            style={{
              width: 14,
              height: 14,
              background: 'radial-gradient(closest-side, rgba(253,224,71,0.85), rgba(253,224,71,0) 70%)',
            }}
            animate={{ opacity: [0.55, 1, 0.55] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
        <div
          className="relative rounded-full"
          style={{
            width: 4.5,
            height: 4.5,
            backgroundColor: lit ? '#fde68a' : '#cbd5e1',
            boxShadow: lit ? '0 0 4px 1.5px rgba(253,224,71,0.9)' : 'none',
          }}
        />
      </div>
      <div style={{ width: 1.5, height: 11 }} className="bg-slate-500" />
      <div style={{ width: 6, height: 1.5 }} className="bg-slate-500 rounded-full" />
    </div>
  );
}

function SignalLight({ left }) {
  return (
    <div className="absolute bottom-4 pointer-events-none flex flex-col items-center" style={{ left }}>
      <div className="relative flex items-center justify-center rounded-sm bg-slate-800" style={{ width: 7, height: 8 }}>
        <motion.div
          className="absolute rounded-full"
          style={{
            width: 10,
            height: 10,
            background: 'radial-gradient(closest-side, rgba(239,68,68,0.8), rgba(239,68,68,0) 70%)',
          }}
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div
          className="relative rounded-full"
          style={{ width: 3.5, height: 3.5, backgroundColor: '#ef4444', boxShadow: '0 0 4px 1.5px rgba(239,68,68,0.9)' }}
        />
      </div>
      <div style={{ width: 1.5, height: 13 }} className="bg-slate-500" />
      <div style={{ width: 6, height: 1.5 }} className="bg-slate-500 rounded-full" />
    </div>
  );
}

const nightStars = [
  { left: '10%', top: '10%', delay: 0 },
  { left: '24%', top: '30%', delay: 0.6 },
  { left: '47%', top: '5%', delay: 1.1 },
  { left: '63%', top: '25%', delay: 0.3 },
  { left: '85%', top: '12%', delay: 0.9 },
];

function NavTrainRunner() {
  const period = useTimeOfDay();
  const theme = skyTheme[period] ?? skyTheme.noon;
  const palette = scenePalette[period] ?? scenePalette.noon;
  const [m1, m2, m3] = palette.mountains;
  const [t1, t2] = palette.trees;

  return (
    <div
      className={`hidden md:block relative flex-1 h-12 mx-4 overflow-hidden rounded-lg bg-gradient-to-b ${theme.gradient}`}
    >
      {theme.isDark ? (
        nightStars.map((s, i) => <Star key={i} {...s} />)
      ) : (
        <>
          <Cloud width={24} top={0} duration={22} delay={0} opacity={0.5} color={palette.cloud} />
          <Cloud width={30} top={6} duration={28} delay={9} opacity={0.35} color={palette.cloud} />
        </>
      )}

      {/* mountains in the far background, evenly spaced with clear gaps */}
      <Mountain left="4%" width={54} height={22} color={m1} snow />
      <Mountain left="42%" width={48} height={19} color={m2} />
      <Mountain left="78%" width={52} height={21} color={m3} snow />
      <Waterfall left="9%" height={14} />

      {/* trees, placed in the gaps between mountains so nothing overlaps */}
      <Tree left="13%" size={12} color={t1} />
      <Tree left="20%" size={14} color={t2} />
      <Tree left="26%" size={13} color={t2} />
      <Tree left="32%" size={15} color={t1} />
      <Tree left="47%" size={13} color={t2} />
      <Tree left="55%" size={15} color={t1} />
      <Tree left="60%" size={13} color={t2} />
      <Tree left="66%" size={15} color={t1} />
      <Tree left="86%" size={13} color={t2} />
      <Tree left="92%" size={13} color={t2} />

      {/* trackside lamps, lit at dusk/night */}
      <StreetLight left="8%" lit={period === 'evening' || period === 'night'} />
      <StreetLight left="17%" lit={period === 'evening' || period === 'night'} />
      <StreetLight left="37%" lit={period === 'evening' || period === 'night'} />
      <StreetLight left="45%" lit={period === 'evening' || period === 'night'} />
      <StreetLight left="50%" lit={period === 'evening' || period === 'night'} />
      <StreetLight left="71%" lit={period === 'evening' || period === 'night'} />
      <StreetLight left="90%" lit={period === 'evening' || period === 'night'} />

      {/* red signal posts at the start, middle, and end */}
      <SignalLight left="1%" />
      <SignalLight left="49%" />
      <SignalLight left="97%" />

      {/* railway track: two rails + sleepers */}
      <div className="absolute inset-x-0 bottom-2 h-2">
        <div
          className="absolute inset-x-0 top-0 h-full opacity-80"
          style={{
            backgroundImage: `repeating-linear-gradient(90deg, ${palette.sleeper} 0px, ${palette.sleeper} 3px, transparent 3px, transparent 9px)`,
          }}
        />
        <div className="absolute inset-x-0 top-0 h-[1.5px] rounded-full" style={{ backgroundColor: palette.rail }} />
        <div className="absolute inset-x-0 bottom-0 h-[1.5px] rounded-full" style={{ backgroundColor: palette.rail }} />
      </div>

      <motion.div
        className="absolute bottom-2"
        initial={{ left: '-15%' }}
        animate={{ left: '110%' }}
        transition={{ duration: 7, repeat: Infinity, ease: 'linear' }}
      >
        {/* glowing halo that travels with the train */}
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
          style={{ width: 70, height: 40, background: 'radial-gradient(closest-side, rgba(251,146,60,0.55), rgba(251,146,60,0) 70%)' }}
          animate={{ opacity: [0.5, 0.9, 0.5], scale: [0.9, 1.1, 0.9] }}
          transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* motion trail streaking behind */}
        <motion.div
          className="absolute right-full top-1/2 -translate-y-1/2 h-1.5 w-14 rounded-full bg-gradient-to-l from-orange-400/90 to-transparent"
          animate={{ opacity: [0.9, 0.4, 0.9] }}
          transition={{ duration: 0.5, repeat: Infinity, ease: 'easeInOut' }}
        />

        <motion.div
          animate={{ y: [0, -2, 0, -2, 0] }}
          transition={{ duration: 0.25, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transform: 'scale(0.6)', transformOrigin: 'left bottom' }}
        >
          <TrainIcon />
        </motion.div>
      </motion.div>
    </div>
  );
}

function HomeIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 10 9-7 9 7" />
      <path d="M5 9v11a1 1 0 0 0 1 1h4v-7h4v7h4a1 1 0 0 0 1-1V9" />
    </svg>
  );
}

function FindTrainsIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="10" r="6.5" />
      <path d="m20 20-4.4-4.4" />
    </svg>
  );
}

function TatkalIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2z" />
      <path d="M13 5v2M13 11v2M13 17v2" />
    </svg>
  );
}

function DelayReportsIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 11 18-5v12L3 13v-2Z" />
      <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
    </svg>
  );
}

function LiveStatusIcon() {
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

function ExperienceIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

const menuLinks = [
  { to: '/', key: 'home', Icon: HomeIcon },
  { to: '/trains', key: 'trackTrains', Icon: FindTrainsIcon },
  { to: '/trains?tatkal=1', key: 'tatkalBooking', Icon: TatkalIcon },
  { to: '/trains?delay=1', key: 'delayReports', Icon: DelayReportsIcon },
  { to: '/trains?live=1', key: 'liveStatus', Icon: LiveStatusIcon },
  { to: '/trains?experience=1', key: 'passengerExperience', Icon: ExperienceIcon },
];

function MenuButton() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const location = useLocation();

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <motion.button
        onClick={() => setOpen((o) => !o)}
        aria-label="Menu"
        aria-expanded={open}
        whileTap={{ scale: 0.92 }}
        className={`p-2 rounded-lg flex flex-col items-center justify-center gap-[4px] transition-colors ${
          open ? 'bg-orange-100' : 'hover:bg-slate-100'
        }`}
      >
        <motion.span
          animate={open ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
          transition={{ duration: 0.2 }}
          className={`block w-5 h-0.5 rounded-full ${open ? 'bg-orange-500' : 'bg-slate-700'}`}
        />
        <motion.span
          animate={open ? { opacity: 0 } : { opacity: 1 }}
          transition={{ duration: 0.15 }}
          className="block w-5 h-0.5 bg-slate-700 rounded-full"
        />
        <motion.span
          animate={open ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
          transition={{ duration: 0.2 }}
          className={`block w-5 h-0.5 rounded-full ${open ? 'bg-orange-500' : 'bg-slate-700'}`}
        />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute left-0 mt-2 w-56 rounded-2xl border border-slate-200 shadow-xl shadow-slate-500/10 z-20"
          >
            <div className="rounded-2xl bg-white overflow-hidden p-1.5">
              {menuLinks.map((link, i) => {
                const active = location.pathname + location.search === link.to;
                return (
                  <motion.div
                    key={link.key}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.15 }}
                  >
                    <Link
                      to={link.to}
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        active ? 'bg-orange-50 text-orange-700' : 'text-slate-700 hover:bg-slate-50 hover:text-orange-600'
                      }`}
                    >
                      <span
                        className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
                          active ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        <link.Icon />
                      </span>
                      {t(`navbar.menu.${link.key}`)}
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CopyIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92Z" />
    </svg>
  );
}

function StationIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
      <path d="M12 21s-7-5.686-7-11a7 7 0 0 1 14 0c0 5.314-7 11-7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}

function AvatarCircle({ user, size = 28 }) {
  if (user.avatar) {
    return (
      <img
        src={user.avatar}
        alt={user.name}
        style={{ width: size, height: size }}
        className="rounded-full object-cover flex-shrink-0"
      />
    );
  }
  return (
    <span
      style={{ width: size, height: size }}
      className="rounded-full bg-orange-100 text-orange-700 font-semibold flex items-center justify-center flex-shrink-0"
    >
      {user.name.charAt(0).toUpperCase()}
    </span>
  );
}

function AccountMenu({ onLogoutClick }) {
  const { t } = useTranslation();
  const { user, updateProfile } = useAuth();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: user.name,
    bio: user.bio || '',
    avatar: user.avatar || '',
    links: user.links?.length ? user.links : [''],
    phone: user.phone || '',
    homeStation: user.homeStation || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [avatarError, setAvatarError] = useState('');
  const [copied, setCopied] = useState(false);
  const ref = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setEditing(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function startEditing() {
    setForm({
      name: user.name,
      bio: user.bio || '',
      avatar: user.avatar || '',
      links: user.links?.length ? user.links : [''],
      phone: user.phone || '',
      homeStation: user.homeStation || '',
    });
    setError('');
    setAvatarError('');
    setEditing(true);
  }

  function updateLinkAt(index, value) {
    setForm((f) => ({ ...f, links: f.links.map((l, i) => (i === index ? value : l)) }));
  }

  function addLinkField() {
    setForm((f) => (f.links.length >= 10 ? f : { ...f, links: [...f.links, ''] }));
  }

  function removeLinkAt(index) {
    setForm((f) => ({ ...f, links: f.links.filter((_, i) => i !== index) }));
  }

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarError('');
    try {
      const dataUrl = await fileToResizedDataUrl(file);
      setForm((f) => ({ ...f, avatar: dataUrl }));
    } catch {
      setAvatarError('Could not load that image');
    } finally {
      e.target.value = '';
    }
  }

  async function handleCopyEmail() {
    try {
      await navigator.clipboard.writeText(user.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable, ignore
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await updateProfile({
        name: form.name,
        bio: form.bio,
        avatar: form.avatar,
        links: form.links.map((l) => l.trim()).filter(Boolean),
        phone: form.phone,
        homeStation: form.homeStation,
      });
      setEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full bg-gradient-to-r from-orange-100 to-amber-100 hover:from-orange-200 hover:to-amber-200 transition-colors"
      >
        <span className="relative flex-shrink-0">
          <AvatarCircle user={user} size={28} />
          <span
            className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white"
            title="Active now"
          />
        </span>
        <span className="text-sm text-black font-medium hidden lg:inline">{user.name}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-20"
          >
            {!editing ? (
              <div>
                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-orange-200 via-amber-100 to-orange-50 border-b border-orange-200">
                  <div className="relative flex-shrink-0">
                    <div className="rounded-full ring-2 ring-orange-200">
                      <AvatarCircle user={user} size={48} />
                    </div>
                    <span
                      className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-white"
                      title={t('navbar.activeNow')}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-slate-900 truncate">{user.name}</span>
                      <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 border border-orange-200 px-2 py-0.5 rounded-full text-[11px] font-medium capitalize">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {user.role}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      <button
                        onClick={handleCopyEmail}
                        aria-label={t('navbar.copyEmail')}
                        className="text-slate-400 hover:text-orange-600 flex-shrink-0"
                      >
                        {copied ? <CheckIcon /> : <CopyIcon />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="px-4 pb-4 -mt-px bg-white max-h-[60vh] overflow-y-auto">
                  <p className="text-sm text-slate-600 mt-3 whitespace-pre-wrap break-words">
                    {user.bio || <span className="text-slate-400 italic">{t('navbar.noBio')}</span>}
                  </p>

                  {user.links?.length > 0 && (
                    <div className="flex flex-col gap-1 mt-2">
                      {user.links.map((link, i) => (
                        <a
                          key={i}
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-sm text-orange-600 hover:text-orange-700 hover:underline min-w-0"
                        >
                          <LinkIcon />
                          <span className="truncate">{link.replace(/^https?:\/\//, '')}</span>
                        </a>
                      ))}
                    </div>
                  )}

                  {(user.phone || user.homeStation) && (
                    <div className="flex flex-col gap-1 mt-2">
                      {user.phone && (
                        <div className="flex items-center gap-1.5 text-sm text-slate-600">
                          <PhoneIcon />
                          <span>{user.phone}</span>
                        </div>
                      )}
                      {user.homeStation && (
                        <div className="flex items-center gap-1.5 text-sm text-slate-600">
                          <StationIcon />
                          <span className="truncate">{user.homeStation}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-orange-100/70">
                    <button
                      onClick={startEditing}
                      className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                    >
                      <EditIcon />
                      {t('navbar.editProfile')}
                    </button>
                    <button
                      onClick={() => {
                        setOpen(false);
                        onLogoutClick();
                      }}
                      className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:border-red-300 hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      <LogoutIcon />
                      {t('navbar.logOut')}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSave}>
                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-orange-200 via-amber-100 to-orange-50 border-b border-orange-200">
                  <span className="relative flex-shrink-0">
                    <div className="rounded-full ring-2 ring-orange-200">
                      <AvatarCircle user={{ name: form.name || user.name, avatar: form.avatar }} size={56} />
                    </div>
                    <span
                      className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-white"
                      title="Active now"
                    />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs font-medium px-2.5 py-1 rounded-full bg-white text-orange-700 border border-orange-200 hover:bg-orange-100 transition-colors"
                      >
                        {t('navbar.changePhoto')}
                      </button>
                      {form.avatar && (
                        <button
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, avatar: '' }))}
                          className="text-xs text-slate-500 hover:text-red-600 underline transition-colors"
                        >
                          {t('navbar.removePhoto')}
                        </button>
                      )}
                    </div>
                    {avatarError && <p className="text-xs text-red-600 mt-1">{avatarError}</p>}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </div>
                </div>

                <div className="p-4 -mt-px space-y-3 bg-white max-h-[60vh] overflow-y-auto">
                  {error && <p className="text-xs text-red-600">{error}</p>}

                  <div className="group">
                    <label className="text-xs font-semibold text-slate-600 group-focus-within:text-orange-600 transition-colors">
                      {t('navbar.fields.name')}
                    </label>
                    <div className="relative mt-1 rounded-lg overflow-hidden bg-white border border-slate-300 group-focus-within:ring-2 group-focus-within:ring-orange-400 group-focus-within:border-orange-400 group-focus-within:shadow-[0_0_12px_rgba(251,146,60,0.35)]">
                      <div className="absolute inset-0 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none">
                        <div className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-orange-200/70 to-transparent animate-input-shimmer" />
                      </div>
                      <motion.input
                        type="text"
                        required
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        whileFocus={{ scale: 1.02 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        className="relative w-full bg-transparent px-2.5 py-1.5 text-sm focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="group">
                    <label className="text-xs font-semibold text-slate-600 group-focus-within:text-orange-600 transition-colors">
                      {t('navbar.fields.bio')}
                    </label>
                    <div className="relative mt-1 rounded-lg overflow-hidden bg-white border border-slate-300 group-focus-within:ring-2 group-focus-within:ring-orange-400 group-focus-within:border-orange-400 group-focus-within:shadow-[0_0_12px_rgba(251,146,60,0.35)]">
                      <div className="absolute inset-0 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none">
                        <div className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-orange-200/70 to-transparent animate-input-shimmer" />
                      </div>
                      <motion.textarea
                        value={form.bio}
                        onChange={(e) => setForm({ ...form, bio: e.target.value })}
                        maxLength={200}
                        rows={3}
                        placeholder={t('navbar.fields.bioPlaceholder')}
                        whileFocus={{ scale: 1.02 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        className="relative w-full bg-transparent px-2.5 py-1.5 text-sm resize-none focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-600">{t('navbar.fields.links')}</label>
                      <span className="text-[11px] text-slate-400">{form.links.length}/10</span>
                    </div>
                    <div className="space-y-2 mt-1">
                      <AnimatePresence initial={false}>
                        {form.links.map((value, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.15 }}
                            className="group flex items-center gap-1.5"
                          >
                            <div className="relative flex-1 rounded-lg overflow-hidden bg-white border border-slate-300 group-focus-within:ring-2 group-focus-within:ring-orange-400 group-focus-within:border-orange-400 group-focus-within:shadow-[0_0_12px_rgba(251,146,60,0.35)]">
                              <div className="absolute inset-0 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none">
                                <div className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-orange-200/70 to-transparent animate-input-shimmer" />
                              </div>
                              <motion.input
                                type="text"
                                value={value}
                                onChange={(e) => updateLinkAt(index, e.target.value)}
                                placeholder={t('navbar.fields.linkPlaceholder')}
                                whileFocus={{ scale: 1.02 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                className="relative w-full bg-transparent px-2.5 py-1.5 text-sm focus:outline-none"
                              />
                            </div>
                            {form.links.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeLinkAt(index)}
                                aria-label="Remove link"
                                className="text-slate-400 hover:text-red-600 flex-shrink-0 p-1"
                              >
                                <XIcon />
                              </button>
                            )}
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                    {form.links.length < 10 && (
                      <button
                        type="button"
                        onClick={addLinkField}
                        className="flex items-center gap-1 text-xs font-medium text-orange-600 hover:text-orange-700 mt-2"
                      >
                        <PlusIcon />
                        {t('navbar.fields.addLink')}
                      </button>
                    )}
                  </div>
                  <div className="group">
                    <label className="text-xs font-semibold text-slate-600 group-focus-within:text-orange-600 transition-colors">
                      {t('navbar.fields.phone')}
                    </label>
                    <div className="relative mt-1 rounded-lg overflow-hidden bg-white border border-slate-300 group-focus-within:ring-2 group-focus-within:ring-orange-400 group-focus-within:border-orange-400 group-focus-within:shadow-[0_0_12px_rgba(251,146,60,0.35)]">
                      <div className="absolute inset-0 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none">
                        <div className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-orange-200/70 to-transparent animate-input-shimmer" />
                      </div>
                      <motion.input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="+91 98765 43210"
                        whileFocus={{ scale: 1.02 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        className="relative w-full bg-transparent px-2.5 py-1.5 text-sm focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="group">
                    <label className="text-xs font-semibold text-slate-600 group-focus-within:text-orange-600 transition-colors">
                      {t('navbar.fields.homeStation')}
                    </label>
                    <div className="relative mt-1 rounded-lg overflow-hidden bg-white border border-slate-300 group-focus-within:ring-2 group-focus-within:ring-orange-400 group-focus-within:border-orange-400 group-focus-within:shadow-[0_0_12px_rgba(251,146,60,0.35)]">
                      <div className="absolute inset-0 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none">
                        <div className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-orange-200/70 to-transparent animate-input-shimmer" />
                      </div>
                      <motion.input
                        type="text"
                        value={form.homeStation}
                        onChange={(e) => setForm({ ...form, homeStation: e.target.value })}
                        placeholder={t('navbar.fields.homeStationPlaceholder')}
                        whileFocus={{ scale: 1.02 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        className="relative w-full bg-transparent px-2.5 py-1.5 text-sm focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setEditing(false)}
                      className="text-sm font-medium px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:border-red-300 hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      {t('navbar.cancel')}
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="text-sm font-medium px-3 py-1.5 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-emerald-500 hover:to-green-500 disabled:opacity-50 transition-colors"
                    >
                      {saving ? t('navbar.saving') : t('navbar.save')}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function LogoutConfirm({ onConfirm, onCancel }) {
  const { t } = useTranslation();
  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center px-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm"
      >
        <h2 className="text-base font-semibold text-slate-900 mb-1">{t('navbar.logoutConfirm.title')}</h2>
        <p className="text-sm text-slate-600 mb-5">{t('navbar.logoutConfirm.body')}</p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="text-sm font-medium px-3 py-1.5 rounded border border-slate-300 hover:bg-slate-50"
          >
            {t('navbar.logoutConfirm.cancel')}
          </button>
          <button
            onClick={onConfirm}
            className="text-sm font-medium px-3 py-1.5 rounded bg-red-600 text-white hover:bg-red-700"
          >
            {t('navbar.logoutConfirm.confirm')}
          </button>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
}

export default function Navbar() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <motion.nav
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-slate-200"
    >
      <div className="w-full px-3 sm:px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <MenuButton />

          <div className="hidden sm:flex">
            <DigitalClock />
          </div>

          <Link to="/" className="flex items-center gap-2 text-base sm:text-lg font-bold text-slate-900 tracking-tight whitespace-nowrap">
            <StationClock size={42} />
            <span>
              Train<span className="text-orange-500">Mitra</span>
            </span>
          </Link>
        </div>

        <NavTrainRunner />

        {user ? (
          <AccountMenu onLogoutClick={() => setConfirmOpen(true)} />
        ) : (
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <Link
              to="/login"
              className="text-xs sm:text-sm font-medium px-2 sm:px-3 py-1.5 rounded hover:bg-slate-100"
            >
              {t('navbar.login')}
            </Link>
            <Link
              to="/register"
              className="text-xs sm:text-sm font-medium bg-slate-900 text-white rounded px-2 sm:px-3 py-1.5 hover:bg-slate-800"
            >
              {t('navbar.register')}
            </Link>
          </div>
        )}
      </div>

      <AnimatePresence>
        {confirmOpen && (
          <LogoutConfirm
            onCancel={() => setConfirmOpen(false)}
            onConfirm={() => {
              setConfirmOpen(false);
              logout();
            }}
          />
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
