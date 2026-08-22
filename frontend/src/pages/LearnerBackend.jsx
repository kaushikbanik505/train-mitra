import { useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import Footer from '../components/Footer';
import { BackLink, FileCard } from '../components/learnerUI';
import SkyBackground, { skyTheme } from '../components/SkyBackground';
import useTimeOfDay from '../hooks/useTimeOfDay';
import { fileMap } from '../content/fileMapContent';
import { backendSource } from '../content/backendSource.generated';

const sourceByPath = Object.fromEntries(backendSource.map((f) => [f.path, f.content]));
const backendSection = fileMap.find((s) => s.section === 'Backend');

const flatFiles = backendSection.groups.flatMap((g) =>
  g.files.map((f) => ({ ...f, path: `${g.dir}${f.name}` }))
);

function SortIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 5h10M11 9h7M11 13h4" />
      <path d="m3 17 3 3 3-3M6 18V4" />
    </svg>
  );
}

function SortToggle({ mode, setMode, isDark, accent }) {
  const base = 'inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-full transition-colors';
  const active = accent;
  const inactive = isDark ? 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50';
  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={() => setMode('folder')} className={`${base} ${mode === 'folder' ? active : inactive}`}>
        Folder order
      </button>
      <button type="button" onClick={() => setMode('rating')} className={`${base} ${mode === 'rating' ? active : inactive}`}>
        <SortIcon /> Most important first
      </button>
    </div>
  );
}

export default function LearnerBackend() {
  const reduceMotion = useReducedMotion();
  const period = useTimeOfDay();
  const isDark = skyTheme[period].isDark;
  const [sortMode, setSortMode] = useState('folder');

  const sortedFlat = useMemo(() => [...flatFiles].sort((a, b) => b.rating - a.rating), []);

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: reduceMotion ? 0 : 0.04, delayChildren: 0.05 } },
  };
  const item = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  };

  const totalFiles = flatFiles.length;

  return (
    <div className={`relative overflow-hidden min-h-screen flex flex-col bg-gradient-to-b transition-colors duration-1000 ${skyTheme[period].gradient}`}>
      <SkyBackground period={period} reduceMotion={reduceMotion} />

      <div className="relative flex-1">
        <div className="max-w-3xl mx-auto px-4 py-10 sm:py-14">
          <BackLink to="/learner" isDark={isDark}>Back to Learner</BackLink>

          <motion.div initial="hidden" animate="show" variants={container}>
            <motion.div variants={item} className="mb-6">
              <p className="text-xs font-semibold tracking-wide text-emerald-400 uppercase mb-2">Backend</p>
              <h1 className={`text-2xl sm:text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Every backend file, in full</h1>
              <p className={`text-sm sm:text-base max-w-xl ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                All {totalFiles} files under backend/src. Click a file's header to expand its code - each one
                already has its explanation open below it.
              </p>
            </motion.div>

            <motion.div variants={item} className="mb-8">
              <SortToggle mode={sortMode} setMode={setSortMode} isDark={isDark} accent="bg-emerald-500 text-white" />
            </motion.div>

            {sortMode === 'folder' ? (
              backendSection.groups.map((g) => (
                <div key={g.dir} className="mb-10">
                  <motion.p variants={item} className={`text-xs font-mono mb-3 ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>{g.dir}</motion.p>
                  <div className="space-y-4">
                    {g.files.map((f) => {
                      const path = `${g.dir}${f.name}`;
                      return (
                        <motion.div key={path} variants={item}>
                          <FileCard path={path} rating={f.rating} explanation={f.explanation} code={sourceByPath[path] ?? '// source not found'} isDark={isDark} />
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              ))
            ) : (
              <div className="space-y-4 mb-10">
                {sortedFlat.map((f) => (
                  <motion.div key={f.path} variants={item}>
                    <FileCard path={f.path} rating={f.rating} explanation={f.explanation} code={sourceByPath[f.path] ?? '// source not found'} isDark={isDark} />
                  </motion.div>
                ))}
              </div>
            )}

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
