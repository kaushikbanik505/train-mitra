import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import TrainTrack from './TrainTrack';
import SkyBackground, { skyTheme } from './SkyBackground';
import LiveStatsBadges from './LiveStatsBadges';
import AboutBadge from './AboutBadge';
import ChatBadge from './ChatBadge';
import LanguageBadge from './LanguageBadge';
import DeveloperBadge from './DeveloperBadge';
import LearnerBadge from './LearnerBadge';
import WhatsNextBadge from './WhatsNextBadge';
import AdminBadge from './AdminBadge';
import useTimeOfDay from '../hooks/useTimeOfDay';
import logo from '../assets/train_station_16x9_stretched.jpg';

function DriftingClouds({ reduceMotion }) {
  if (reduceMotion) return null;
  return (
    <>
      <motion.div
        aria-hidden
        className="pointer-events-none absolute top-8 left-[10%] w-40 h-14 rounded-full bg-white/40 blur-xl hidden sm:block"
        animate={{ x: [0, 60, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute top-20 left-[55%] w-28 h-10 rounded-full bg-white/30 blur-lg hidden sm:block"
        animate={{ x: [0, -40, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute top-4 left-[75%] w-24 h-8 rounded-full bg-white/30 blur-lg hidden sm:block"
        animate={{ x: [0, 30, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
      />
    </>
  );
}

function TiltCard({ children, reduceMotion }) {
  const ref = useRef(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { stiffness: 150, damping: 15 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [8, -8]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-8, 8]), springConfig);

  function handleMouseMove(e) {
    if (reduceMotion || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  function handleMouseLeave() {
    mouseX.set(0);
    mouseY.set(0);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformPerspective: 800 }}
      className="relative max-w-md mx-auto lg:max-w-none"
    >
      {children}
    </motion.div>
  );
}

export default function Hero() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const reduceMotion = useReducedMotion();
  const period = useTimeOfDay();
  const isDark = skyTheme[period].isDark;

  const container = {
    hidden: {},
    show: {
      transition: { staggerChildren: reduceMotion ? 0 : 0.12, delayChildren: 0.05 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 18 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  };

  return (
    <section
      className={`relative overflow-hidden bg-gradient-to-b transition-colors duration-1000 ${skyTheme[period].gradient}`}
    >
      <SkyBackground period={period} reduceMotion={reduceMotion} />

      {!isDark && (
        <>
          <motion.div
            aria-hidden
            className="pointer-events-none absolute -top-24 -left-24 w-72 h-72 rounded-full bg-orange-200/40 blur-3xl"
            animate={reduceMotion ? {} : { scale: [1, 1.15, 1], x: [0, 20, 0], y: [0, 10, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            aria-hidden
            className="pointer-events-none absolute top-1/3 -right-20 w-72 h-72 rounded-full bg-purple-200/30 blur-3xl"
            animate={reduceMotion ? {} : { scale: [1, 1.2, 1], x: [0, -15, 0], y: [0, -15, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          />
          <DriftingClouds reduceMotion={reduceMotion} />
        </>
      )}

      <div className="relative max-w-6xl mx-auto px-4 py-12 sm:py-16 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="text-center lg:text-left order-2 lg:order-1"
          >
            <motion.div variants={item} className="mb-4 flex flex-row flex-wrap items-center justify-center lg:justify-start gap-2">
              <LiveStatsBadges direction="row" />
              <AboutBadge />
              <ChatBadge />
              <LanguageBadge />
            </motion.div>

            <motion.span
              variants={item}
              className={`inline-block text-xs font-semibold tracking-wide px-3 py-1 rounded-full mb-4 ${
                isDark ? 'text-orange-200 bg-white/10' : 'text-orange-700 bg-green-100'
              }`}
            >
              {t('hero.eyebrow')}
            </motion.span>

            <motion.h1
              variants={item}
              className={`text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              {t('hero.headlineStart')}{' '}
              <span className="bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
                {t('hero.headlineHighlight')}
              </span>
            </motion.h1>

            <motion.p
              variants={item}
              className={`mt-4 text-base sm:text-lg max-w-md mx-auto lg:mx-0 ${
                isDark ? 'text-slate-300' : 'text-slate-600'
              }`}
            >
              {t('hero.subtitle')}
            </motion.p>

            {!user && (
              <motion.div
                variants={item}
                className="mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3"
              >
                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} className="w-full sm:w-auto">
                  <Link
                    to="/register"
                    className="block w-full sm:w-auto text-center bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg px-6 py-3 text-sm shadow-lg shadow-orange-200/50"
                  >
                    {t('hero.createAccount')}
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} className="w-full sm:w-auto">
                  <a
                    href="#features"
                    className={`block w-full sm:w-auto text-center font-medium rounded-lg px-6 py-3 text-sm border ${
                      isDark
                        ? 'text-white border-white/30 hover:bg-white/10'
                        : 'text-slate-700 border-slate-300 hover:bg-white'
                    }`}
                  >
                    {t('hero.seeWhatItDoes')}
                  </a>
                </motion.div>
              </motion.div>
            )}

            <motion.p variants={item} className={`mt-6 text-xs ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>
              {t('hero.footnote')}
            </motion.p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.9, rotate: reduceMotion ? 0 : -2 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut', delay: 0.15 }}
            className="order-1 lg:order-2"
          >
            <TiltCard reduceMotion={reduceMotion}>
              <div className="absolute -inset-3 bg-orange-200/50 rounded-3xl -rotate-2 hidden sm:block" />
              <motion.img
                src={logo}
                alt="A chai wallah serving tea from a train at a station platform at sunset"
                className="relative w-full h-auto rounded-2xl shadow-xl"
                animate={reduceMotion ? {} : { y: [0, -10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              />
            </TiltCard>
          </motion.div>
        </div>

        <TrainTrack />

        <motion.div
          initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-wrap justify-center gap-2 mt-8 sm:mt-10"
        >
          <DeveloperBadge />
          <LearnerBadge />
          <WhatsNextBadge />
          <AdminBadge />
        </motion.div>
      </div>
    </section>
  );
}
