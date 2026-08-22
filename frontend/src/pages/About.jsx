import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import Footer from '../components/Footer';
import { aboutSections } from '../content/aboutContent';

function BackArrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M11 18l-6-6 6-6" />
    </svg>
  );
}

export default function About() {
  const reduceMotion = useReducedMotion();

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: reduceMotion ? 0 : 0.08, delayChildren: 0.05 } },
  };
  const item = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 14 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="flex-1">
        <div className="max-w-2xl mx-auto px-4 py-10 sm:py-14">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-orange-600 transition-colors mb-6"
          >
            <BackArrow /> Back to home
          </Link>

          <motion.div initial="hidden" animate="show" variants={container}>
            <motion.p variants={item} className="text-xs font-semibold tracking-wide text-orange-600 uppercase mb-2">
              About
            </motion.p>
            <motion.h1 variants={item} className="text-2xl sm:text-3xl font-bold text-slate-900 mb-8">
              Train<span className="text-orange-500">Mitra</span>, in short
            </motion.h1>

            <div className="space-y-6">
              {aboutSections.map((s) => (
                <motion.div key={s.heading} variants={item}>
                  <h2 className="text-sm font-semibold text-orange-600 uppercase tracking-wide mb-1.5">{s.heading}</h2>
                  <p className="text-sm sm:text-base text-slate-600 leading-relaxed">{s.body}</p>
                </motion.div>
              ))}
            </div>

            <motion.div variants={item} className="mt-10 pt-6 border-t border-slate-200">
              <p className="text-sm text-slate-400">Designed &amp; developed by Kaushik Banik</p>
            </motion.div>
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
