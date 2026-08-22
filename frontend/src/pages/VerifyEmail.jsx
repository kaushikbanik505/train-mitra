import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { TrainIcon } from '../components/TrainTrack';
import SkyBackground, { skyTheme } from '../components/SkyBackground';
import Bubbles from '../components/Bubbles';
import useTimeOfDay from '../hooks/useTimeOfDay';

function CheckIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function XCircleIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6M9 9l6 6" />
    </svg>
  );
}

export default function VerifyEmail() {
  const { verifyEmail } = useAuth();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const period = useTimeOfDay();
  const reduceMotion = useReducedMotion();
  const isDark = skyTheme[period].isDark;
  const isDaytime = period === 'morning' || period === 'noon';

  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('This verification link is missing its token.');
      return;
    }
    let cancelled = false;
    verifyEmail(token)
      .then((data) => {
        if (!cancelled) {
          setStatus('success');
          setMessage(data.message || 'Email verified.');
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setStatus('error');
          setMessage(err.response?.data?.message || 'Verification failed.');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [token, verifyEmail]);

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
          <div className={`relative rounded-[15px] p-6 text-center ${isDark ? 'bg-slate-900/80 backdrop-blur-sm' : 'bg-white'}`}>
            {status === 'loading' && (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className={`mx-auto mb-4 w-10 h-10 rounded-full border-[3px] border-t-transparent ${
                    isDark ? 'border-orange-400' : 'border-orange-500'
                  }`}
                />
                <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Verifying your email...</p>
              </>
            )}

            {status === 'success' && (
              <>
                <motion.div
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                  className={`mx-auto mb-4 flex items-center justify-center w-14 h-14 rounded-full ${
                    isDark ? 'bg-emerald-500/15 text-emerald-300' : 'bg-emerald-100 text-emerald-600'
                  }`}
                >
                  <CheckIcon />
                </motion.div>
                <h1 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Email verified</h1>
                <p className={`text-sm mb-5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{message}</p>
                <Link
                  to="/login"
                  className="inline-flex w-full items-center justify-center bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl py-3 text-sm font-semibold shadow-md shadow-orange-500/25 hover:shadow-lg hover:shadow-orange-500/30 transition-shadow"
                >
                  Go to login
                </Link>
              </>
            )}

            {status === 'error' && (
              <>
                <motion.div
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                  className={`mx-auto mb-4 flex items-center justify-center w-14 h-14 rounded-full ${
                    isDark ? 'bg-red-500/15 text-red-300' : 'bg-red-100 text-red-600'
                  }`}
                >
                  <XCircleIcon />
                </motion.div>
                <h1 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Verification failed</h1>
                <p className={`text-sm mb-5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{message}</p>
                <Link
                  to="/register"
                  className={`text-sm font-semibold underline underline-offset-2 ${isDark ? 'text-orange-300' : 'text-orange-600'}`}
                >
                  Back to register
                </Link>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
