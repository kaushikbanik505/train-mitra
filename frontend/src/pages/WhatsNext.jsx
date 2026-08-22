import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import Footer from '../components/Footer';
import SkyBackground, { skyTheme } from '../components/SkyBackground';
import useTimeOfDay from '../hooks/useTimeOfDay';
import { futureScopeApp, futureScopeIndustry } from '../content/learnerContent';

function CompassIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
      <circle cx="12" cy="12" r="10" />
      <path d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z" />
    </svg>
  );
}

function TrainFrontIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
      <rect x="4" y="3" width="16" height="14" rx="2" />
      <path d="M4 11h16" />
      <path d="M12 3v8" />
      <path d="m8 19-2 3M16 19l2 3" />
      <path d="M9 17h.01M15 17h.01" />
    </svg>
  );
}

function FutureCard({ title, body, isDark, accentText, accentBorder, accentBg, icon }) {
  return (
    <div className={`rounded-xl border p-4 ${isDark ? 'bg-white/5 border-white/10' : `${accentBg} ${accentBorder}`}`}>
      <div className="flex items-start gap-2.5">
        <span className={isDark ? 'text-slate-300' : accentText}>{icon}</span>
        <div>
          <h4 className={`text-sm font-semibold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{title}</h4>
          <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{body}</p>
        </div>
      </div>
    </div>
  );
}

export default function WhatsNext() {
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
            {/* Future scope */}
            <motion.div variants={item} className="mt-12 mb-6">
              <p className="text-xs font-semibold tracking-wide text-violet-400 uppercase mb-1.5">What's next</p>
              <h2 className={`text-xl sm:text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Future scope</h2>
              <p className={`text-sm max-w-xl ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                Honest ideation, not a promised roadmap - what could plausibly get built next, and a step back
                to look at what's still genuinely unsolved in Indian Railways passenger services more broadly.
              </p>
            </motion.div>

            <motion.div variants={item} className="mb-8">
              <h3 className={`text-sm font-bold uppercase tracking-wide mb-3 flex items-center gap-2 ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>
                <TrainFrontIcon /> For TrainMitra itself
              </h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {futureScopeApp.map((f) => (
                  <FutureCard
                    key={f.title}
                    title={f.title}
                    body={f.body}
                    isDark={isDark}
                    icon={<TrainFrontIcon />}
                    accentText="text-emerald-600"
                    accentBorder="border-emerald-100"
                    accentBg="bg-emerald-50/60"
                  />
                ))}
              </div>
            </motion.div>

            <motion.div variants={item} className="mb-10">
              <h3 className={`text-sm font-bold uppercase tracking-wide mb-3 flex items-center gap-2 ${isDark ? 'text-orange-300' : 'text-orange-700'}`}>
                <CompassIcon /> Still unsolved in Indian Railways passenger service, broadly
              </h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {futureScopeIndustry.map((f) => (
                  <FutureCard
                    key={f.title}
                    title={f.title}
                    body={f.body}
                    isDark={isDark}
                    icon={<CompassIcon />}
                    accentText="text-orange-600"
                    accentBorder="border-orange-100"
                    accentBg="bg-orange-50/60"
                  />
                ))}
              </div>
              <p className={`text-xs mt-3 ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>
                These are observations about the space, not commitments - a couple of them (safety reporting
                especially) would need real care in the design before they'd be responsible to build at all.
              </p>
            </motion.div>

            <motion.div variants={item} className={`rounded-xl p-5 mt-8 mb-8 ${isDark ? 'bg-white/10 border border-white/10' : 'bg-slate-900'}`}>
              <h3 className="text-sm font-semibold mb-1.5 text-white">More gets added here too</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                As new features get built, they land on this page and in the Backend/Frontend file lists - same
                rule as the Developer page: kept current, not written once and forgotten.
              </p>
            </motion.div>

            <motion.div variants={item} className={`pt-6 border-t ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>Designed &amp; developed by Kaushik Banik</p>
            </motion.div>
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
