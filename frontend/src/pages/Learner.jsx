import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import Footer from '../components/Footer';
import { CodeBlock } from '../components/learnerUI';
import SkyBackground, { skyTheme } from '../components/SkyBackground';
import useTimeOfDay from '../hooks/useTimeOfDay';
import { projectPitch, codeWalkthroughs } from '../content/learnerContent';

function BulbIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
      <path d="M9 18h6M10 22h4M15.09 14c.18-1 .48-1.5 1.09-2.14A5.66 5.66 0 0 0 18 8 6 6 0 0 0 6 8a5.68 5.68 0 0 0 1.75 4c.83.83 1.07 1.16 1.25 2" />
    </svg>
  );
}

function ServerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="8" rx="2" />
      <rect x="2" y="13" width="20" height="8" rx="2" />
      <path d="M6 7h.01M6 17h.01" />
    </svg>
  );
}

function BrowserIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M2 9h20" />
      <path d="M6 6.5h.01" />
      <path d="M9 6.5h.01" />
    </svg>
  );
}

function WalkthroughCard({ w, isDark }) {
  return (
    <div className={`rounded-2xl border p-4 sm:p-5 ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white'}`}>
      <div className="flex flex-wrap items-center gap-1.5 mb-2">
        {w.tags.map((t) => (
          <span
            key={t}
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${isDark ? 'bg-white/10 text-slate-300' : 'bg-slate-100 text-slate-500'}`}
          >
            {t}
          </span>
        ))}
      </div>
      <h3 className={`text-base font-bold mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>{w.title}</h3>

      <CodeBlock file={w.file} code={w.code} defaultOpen />

      <div className="mt-4 space-y-2.5">
        {w.explanation.map((p, i) => (
          <p key={i} className={`text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{p}</p>
        ))}
      </div>

      <div
        className={`mt-4 flex items-start gap-2.5 rounded-lg border px-3.5 py-3 ${
          isDark ? 'bg-violet-500/10 border-violet-400/20' : 'bg-violet-50 border-violet-100'
        }`}
      >
        <span className={isDark ? 'text-violet-300' : 'text-violet-600'}><BulbIcon /></span>
        <p className={`text-xs leading-relaxed ${isDark ? 'text-violet-200' : 'text-violet-800'}`}>
          <span className="font-semibold">Might come up as: </span>{w.interviewAngle}
        </p>
      </div>
    </div>
  );
}

function SectionButton({ to, icon, title, subtitle, accent }) {
  return (
    <Link
      to={to}
      className={`group flex-1 rounded-2xl border-2 p-5 sm:p-6 transition-all hover:shadow-lg ${accent}`}
    >
      <div className="w-11 h-11 rounded-xl bg-white/80 flex items-center justify-center mb-3 shadow-sm">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-slate-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-600 leading-relaxed">{subtitle}</p>
      <span className="inline-flex items-center gap-1 mt-3 text-xs font-semibold text-slate-700 group-hover:translate-x-0.5 transition-transform">
        View all files →
      </span>
    </Link>
  );
}

export default function Learner() {
  const reduceMotion = useReducedMotion();
  const period = useTimeOfDay();
  const isDark = skyTheme[period].isDark;

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: reduceMotion ? 0 : 0.05, delayChildren: 0.05 } },
  };
  const item = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 14 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  };

  return (
    <div className={`relative overflow-hidden min-h-screen flex flex-col bg-gradient-to-b transition-colors duration-1000 ${skyTheme[period].gradient}`}>
      <SkyBackground period={period} reduceMotion={reduceMotion} />

      <div className="relative flex-1">
        <div className="max-w-3xl mx-auto px-4 py-10 sm:py-14">
          <Link
            to="/"
            className={`inline-flex items-center gap-1.5 text-xs font-semibold transition-colors mb-6 ${
              isDark ? 'text-slate-300 hover:text-orange-300' : 'text-slate-500 hover:text-orange-600'
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M11 18l-6-6 6-6" />
            </svg>
            Back to home
          </Link>

          <motion.div initial="hidden" animate="show" variants={container}>
            <motion.div variants={item} className="mb-8">
              <p className="text-xs font-semibold tracking-wide text-violet-400 uppercase mb-2">Learner</p>
              <h1 className={`text-2xl sm:text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Learn from the code</h1>
              <p className={`text-sm sm:text-base max-w-xl ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                Everything here is meant for interview prep - the real code behind this project, why it's built
                the way it is, and the kind of questions it tends to turn into.
              </p>
            </motion.div>

            {/* The pitch */}
            <motion.div
              variants={item}
              className={`mb-10 rounded-2xl border p-5 sm:p-6 ${
                isDark ? 'border-orange-400/20 bg-orange-500/5' : 'border-orange-200 bg-gradient-to-b from-orange-50/60 to-white'
              }`}
            >
              <h2 className={`text-sm font-bold uppercase tracking-wide mb-3 ${isDark ? 'text-orange-300' : 'text-orange-700'}`}>
                The 60-second pitch, for an interviewer
              </h2>
              <div className="space-y-3">
                {projectPitch.map((p, i) => (
                  <p key={i} className={`text-sm leading-relaxed ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{p}</p>
                ))}
              </div>
            </motion.div>

            {/* Two big buttons */}
            <motion.div variants={item} className="mb-10">
              <p className="text-xs font-semibold tracking-wide text-violet-400 uppercase mb-3">Every file, in full</p>
              <div className="flex flex-col sm:flex-row gap-4">
                <SectionButton
                  to="/learner/backend"
                  icon={<span className="text-emerald-600"><ServerIcon /></span>}
                  title="Backend"
                  subtitle="Every backend file - full code plus a detailed explanation of what it does and how it fits the request flow."
                  accent="border-emerald-200 bg-emerald-50/90 hover:bg-emerald-50 backdrop-blur-sm"
                />
                <SectionButton
                  to="/learner/frontend"
                  icon={<span className="text-sky-600"><BrowserIcon /></span>}
                  title="Frontend"
                  subtitle="Every frontend file - full code plus a detailed explanation of what it renders and how it fits the app."
                  accent="border-sky-200 bg-sky-50/90 hover:bg-sky-50 backdrop-blur-sm"
                />
              </div>
            </motion.div>

            {/* Highlights */}
            <motion.div variants={item} className="mb-6">
              <p className="text-xs font-semibold tracking-wide text-violet-400 uppercase mb-1.5">Highlights first</p>
              <h2 className={`text-xl sm:text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {codeWalkthroughs.length} deep-dives worth knowing cold
              </h2>
              <p className={`text-sm max-w-xl ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                The trickiest or most reusable decisions in the whole codebase, picked out from the full
                Backend/Frontend pages above so you can study these first.
              </p>
            </motion.div>

            <div className="space-y-6">
              {codeWalkthroughs.map((w) => (
                <motion.div key={w.id} variants={item}>
                  <WalkthroughCard w={w} isDark={isDark} />
                </motion.div>
              ))}
            </div>

            <motion.div variants={item} className={`mt-12 pt-6 border-t ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>Designed &amp; developed by Kaushik Banik</p>
            </motion.div>
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
