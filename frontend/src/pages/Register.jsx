import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { TrainIcon } from '../components/TrainTrack';
import SkyBackground, { skyTheme } from '../components/SkyBackground';
import Bubbles from '../components/Bubbles';
import useTimeOfDay from '../hooks/useTimeOfDay';

function celebrate() {
  const colors = ['#f97316', '#fbbf24', '#4a3234'];
  confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 }, colors });
  confetti({ particleCount: 50, angle: 60, spread: 55, origin: { x: 0, y: 0.7 }, colors });
  confetti({ particleCount: 50, angle: 120, spread: 55, origin: { x: 1, y: 0.7 }, colors });
}

function UserIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.5-7 8-7s8 3 8 7" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 6-10 7L2 6" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function EyeIcon({ open }) {
  return open ? (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a20.3 20.3 0 0 1 5.06-5.94M9.9 4.24A9.7 9.7 0 0 1 12 4c7 0 11 8 11 8a20.4 20.4 0 0 1-2.16 3.19" />
      <path d="m1 1 22 22" />
      <path d="M9.53 9.53a3 3 0 0 0 4.24 4.24" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4M12 16h.01" />
    </svg>
  );
}

function AuthField({ type, placeholder, value, onChange, icon, dark, minLength, toggle }) {
  return (
    <div className="relative group">
      <div
        className={`relative rounded-xl overflow-hidden border transition-shadow group-focus-within:ring-2 group-focus-within:ring-orange-400 group-focus-within:border-orange-400 group-focus-within:shadow-[0_0_16px_rgba(251,146,60,0.22)] ${
          dark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'
        }`}
      >
        <div className="absolute inset-0 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-orange-100/40 to-transparent animate-input-shimmer" />
        </div>
        <span className={`absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${dark ? 'text-orange-300' : 'text-orange-400'}`}>
          {icon}
        </span>
        <input
          type={type}
          placeholder={placeholder}
          required
          minLength={minLength}
          value={value}
          onChange={onChange}
          className={`relative w-full bg-transparent pl-10 py-3 text-sm font-medium focus:outline-none ${
            toggle ? 'pr-11' : 'pr-3.5'
          } ${dark ? 'text-slate-100 placeholder:text-slate-500' : 'text-slate-800 placeholder:text-slate-400'}`}
        />
        {toggle}
      </div>
    </div>
  );
}

export default function Register() {
  const { t } = useTranslation();
  const { register } = useAuth();
  const navigate = useNavigate();
  const period = useTimeOfDay();
  const reduceMotion = useReducedMotion();
  const isDark = skyTheme[period].isDark;
  const isDaytime = period === 'morning' || period === 'noon';

  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      celebrate();
      setTimeout(() => navigate('/'), 700);
    } catch (err) {
      setError(err.response?.data?.message || t('auth.register.error'));
      setLoading(false);
    }
  }

  return (
    <div
      className={`relative min-h-[calc(100vh-57px)] overflow-hidden bg-gradient-to-b transition-colors duration-1000 flex items-center justify-center px-4 py-10 ${skyTheme[period].gradient}`}
    >
      <SkyBackground period={period} reduceMotion={reduceMotion} />

      {!isDark && (
        <>
          <div className="pointer-events-none absolute -top-24 -left-24 w-80 h-80 rounded-full bg-orange-300/40 blur-3xl" />
          <div className="pointer-events-none absolute top-1/3 -right-24 w-80 h-80 rounded-full bg-amber-300/35 blur-3xl" />
        </>
      )}

      {isDaytime && <Bubbles reduceMotion={reduceMotion} />}

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-sm"
      >
        <motion.div
          className="flex justify-center mb-5"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div
            className={`relative flex items-center justify-center w-16 h-16 rounded-full shadow-inner bg-gradient-to-br ${
              isDark ? 'from-white/10 via-white/5 to-transparent' : 'from-orange-100 via-amber-50 to-orange-50'
            }`}
          >
            <div className={`absolute inset-0 rounded-full blur-xl ${isDark ? 'bg-orange-500/10' : 'bg-orange-200/40'}`} />
            <div className="relative scale-75">
              <TrainIcon />
            </div>
          </div>
        </motion.div>

        <div
          className={`relative rounded-2xl p-[1.5px] shadow-lg shadow-orange-500/5 bg-gradient-to-br ${
            isDark ? 'from-white/20 via-white/10 to-white/20' : 'from-orange-200 via-slate-200 to-amber-200'
          }`}
        >
          <form
            onSubmit={handleSubmit}
            className={`relative rounded-[15px] p-6 space-y-4 ${isDark ? 'bg-slate-900/80 backdrop-blur-sm' : 'bg-white'}`}
          >
            <div className="text-center sm:text-left mb-1">
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full mb-3 ${
                  isDark ? 'text-orange-200 bg-white/10' : 'text-orange-700 bg-orange-100'
                }`}
              >
                {t('auth.register.badge')}
              </span>
              <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t('auth.register.title')}</h1>
            </div>

            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -6, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`flex items-center gap-1.5 text-xs font-medium rounded-lg px-3 py-2 ${
                    isDark ? 'text-red-300 bg-red-500/10' : 'text-red-700 bg-red-50'
                  }`}
                >
                  <AlertIcon />
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <AuthField
              type="text"
              placeholder={t('auth.fields.name')}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              icon={<UserIcon />}
              dark={isDark}
            />
            <AuthField
              type="email"
              placeholder={t('auth.fields.email')}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              icon={<MailIcon />}
              dark={isDark}
            />
            <AuthField
              type={showPassword ? 'text' : 'password'}
              placeholder={t('auth.fields.passwordMinChars')}
              minLength={8}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              icon={<LockIcon />}
              dark={isDark}
              toggle={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                  className={`absolute right-3.5 top-1/2 -translate-y-1/2 ${
                    isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <EyeIcon open={showPassword} />
                </button>
              }
            />

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.985 }}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl py-3 text-sm font-semibold shadow-md shadow-orange-500/25 disabled:opacity-60 transition-shadow hover:shadow-lg hover:shadow-orange-500/30"
            >
              {loading ? t('auth.register.submitting') : t('auth.register.submit')}
            </motion.button>

            <p className={`text-sm text-center ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              {t('auth.register.haveAccount')}{' '}
              <Link to="/login" className={`font-semibold underline underline-offset-2 ${isDark ? 'text-orange-300' : 'text-orange-600'}`}>
                {t('auth.register.loginLink')}
              </Link>
            </p>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
