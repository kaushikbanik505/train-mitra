import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import Footer from '../components/Footer';
import {
  lastUpdated,
  techStack,
  prerequisites,
  setupSteps,
  envVars,
  philosophy,
  features,
  apiEndpoints,
  chatAssistant,
  moderation,
  security,
  contributing,
} from '../content/developerContent';

function BackArrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M11 18l-6-6 6-6" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function CopyIcon({ copied }) {
  return copied ? (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  ) : (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

const TECH_GROUP_ACCENT = {
  Frontend: 'bg-sky-50 text-sky-700 border-sky-200',
  Backend: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  AI: 'bg-orange-50 text-orange-700 border-orange-200',
};

const METHOD_ACCENT = {
  GET: 'bg-sky-100 text-sky-700',
  POST: 'bg-emerald-100 text-emerald-700',
  PATCH: 'bg-amber-100 text-amber-700',
};

const AUTH_LABEL = {
  public: { text: 'Public', className: 'bg-slate-100 text-slate-500' },
  token: { text: 'Requires login', className: 'bg-orange-50 text-orange-600' },
  admin: { text: 'Admin only', className: 'bg-rose-50 text-rose-600' },
};

function SectionHeading({ eyebrow, title }) {
  return (
    <div className="mb-5">
      <p className="text-xs font-semibold tracking-wide text-orange-600 uppercase mb-1.5">{eyebrow}</p>
      <h2 className="text-xl sm:text-2xl font-bold text-slate-900">{title}</h2>
    </div>
  );
}

function TerminalBlock({ title, steps }) {
  const [copiedIndex, setCopiedIndex] = useState(null);

  function handleCopy(cmd, i) {
    navigator.clipboard?.writeText(cmd);
    setCopiedIndex(i);
    setTimeout(() => setCopiedIndex((cur) => (cur === i ? null : cur)), 1400);
  }

  return (
    <div className="rounded-xl overflow-hidden border border-slate-800">
      <div className="bg-slate-800 text-slate-300 text-xs font-semibold px-4 py-2">{title}</div>
      <div className="bg-slate-900 px-4 py-3 space-y-2 font-mono text-[13px]">
        {steps.map((s, i) => (
          <div key={i}>
            <div className="flex items-center justify-between gap-2 group">
              <span className="text-slate-200">
                <span className="text-emerald-400">$</span> {s.cmd}
              </span>
              <button
                type="button"
                onClick={() => handleCopy(s.cmd, i)}
                aria-label="Copy command"
                className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded text-slate-500 hover:text-slate-200 hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100"
              >
                <CopyIcon copied={copiedIndex === i} />
              </button>
            </div>
            {s.note && <div className="text-slate-500 text-xs mt-0.5 font-sans">{s.note}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

function EnvVarTable({ vars }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-left">
              <th className="px-4 py-2.5 font-semibold text-slate-500 text-xs uppercase tracking-wide">Variable</th>
              <th className="px-4 py-2.5 font-semibold text-slate-500 text-xs uppercase tracking-wide">What it's for</th>
              <th className="px-4 py-2.5 font-semibold text-slate-500 text-xs uppercase tracking-wide">Example</th>
            </tr>
          </thead>
          <tbody>
            {vars.map((v) => (
              <tr key={v.name} className="border-b border-slate-50 last:border-0">
                <td className="px-4 py-2.5 font-mono text-xs font-semibold text-slate-800 whitespace-nowrap align-top">{v.name}</td>
                <td className="px-4 py-2.5 text-slate-600 align-top">{v.desc}</td>
                <td className="px-4 py-2.5 font-mono text-xs text-slate-400 align-top">{v.example}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ApiGroup({ group }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
        <h3 className="text-sm font-semibold text-slate-800">{group.group}</h3>
        <code className="text-xs text-slate-400 font-mono">{group.base}</code>
      </div>
      <div className="divide-y divide-slate-50">
        {group.routes.map((r) => (
          <div key={r.method + r.path} className="flex flex-wrap items-start gap-x-3 gap-y-1 px-4 py-2.5">
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded font-mono flex-shrink-0 ${METHOD_ACCENT[r.method]}`}>
              {r.method}
            </span>
            <code className="text-xs text-slate-700 font-mono flex-shrink-0">{r.path}</code>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${AUTH_LABEL[r.auth].className}`}>
              {AUTH_LABEL[r.auth].text}
            </span>
            <span className="text-xs text-slate-500 basis-full sm:basis-auto sm:flex-1">{r.desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Developer() {
  const reduceMotion = useReducedMotion();

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: reduceMotion ? 0 : 0.05, delayChildren: 0.05 } },
  };
  const item = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 14 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  };

  const groupedTech = techStack.reduce((acc, t) => {
    (acc[t.group] ||= []).push(t);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="flex-1">
        <div className="max-w-3xl mx-auto px-4 py-10 sm:py-14">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-orange-600 transition-colors mb-6"
          >
            <BackArrow /> Back to home
          </Link>

          <motion.div initial="hidden" animate="show" variants={container}>
            <motion.div variants={item} className="mb-10">
              <p className="text-xs font-semibold tracking-wide text-orange-600 uppercase mb-2">Developer</p>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
                How Train<span className="text-orange-500">Mitra</span> is built
              </h1>
              <p className="text-sm sm:text-base text-slate-600 max-w-xl">
                Every stack choice, feature, endpoint, and safeguard behind this site - enough to run it on your
                own machine and actually contribute. This is a living document: it gets updated every time
                something real ships, not written once and left to rot.
              </p>
              <p className="text-xs text-slate-400 mt-3">Last updated {lastUpdated}</p>
            </motion.div>

            {/* Tech stack */}
            <motion.section variants={item} className="mb-10">
              <SectionHeading eyebrow="Stack" title="What it's built with" />
              <div className="space-y-3">
                {Object.entries(groupedTech).map(([group, items]) => (
                  <div key={group} className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-slate-400 w-16 flex-shrink-0">{group}</span>
                    {items.map((t) => (
                      <span
                        key={t.name}
                        className={`text-xs font-medium px-2.5 py-1 rounded-full border ${TECH_GROUP_ACCENT[group]}`}
                      >
                        {t.name}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            </motion.section>

            {/* Run it locally */}
            <motion.section variants={item} className="mb-10">
              <SectionHeading eyebrow="Get it running" title="Run it on your machine" />

              <p className="text-sm font-semibold text-slate-700 mb-2">You'll need</p>
              <ul className="space-y-1.5 mb-5">
                {prerequisites.map((p) => (
                  <li key={p} className="flex items-start gap-2.5 text-sm text-slate-600 leading-relaxed">
                    <span className="text-emerald-600"><CheckIcon /></span>
                    {p}
                  </li>
                ))}
              </ul>

              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-slate-700 mb-2">1. Backend</p>
                  <TerminalBlock title="backend" steps={setupSteps.backend} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700 mb-2">2. Frontend (in a second terminal)</p>
                  <TerminalBlock title="frontend" steps={setupSteps.frontend} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700 mb-2">3. Seed some train data</p>
                  <TerminalBlock title="backend" steps={setupSteps.seeding} />
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-3">
                Once both are running: the site is at http://localhost:5173 and the API is at http://localhost:5000.
              </p>
            </motion.section>

            {/* Environment variables */}
            <motion.section variants={item} className="mb-10">
              <SectionHeading eyebrow="Configuration" title="Environment variables" />
              <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 mb-4">
                <span className="text-amber-600 flex-shrink-0 mt-0.5"><LockIcon /></span>
                <p className="text-xs text-amber-800 leading-relaxed">
                  These are placeholder examples, not real values. Use your own MongoDB cluster and your own API
                  keys - never the live production database or keys. <code className="font-mono">backend/.env</code> is
                  gitignored on purpose and is never shared, so nobody should need (or ask for) the real one to run
                  this locally.
                </p>
              </div>
              <p className="text-sm font-semibold text-slate-700 mb-2">backend/.env</p>
              <EnvVarTable vars={envVars.backend} />
              <p className="text-sm font-semibold text-slate-700 mt-4 mb-2">frontend/.env</p>
              <EnvVarTable vars={envVars.frontend} />
            </motion.section>

            {/* Philosophy */}
            <motion.section variants={item} className="mb-10">
              <SectionHeading eyebrow="Approach" title="Design philosophy" />
              <div className="space-y-4">
                {philosophy.map((p) => (
                  <div key={p.title} className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
                    <h3 className="text-sm font-semibold text-slate-900 mb-1">{p.title}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{p.body}</p>
                  </div>
                ))}
              </div>
            </motion.section>

            {/* Features */}
            <motion.section variants={item} className="mb-10">
              <SectionHeading eyebrow="Shipped" title="Features built so far" />
              <div className="grid sm:grid-cols-2 gap-3">
                {features.map((f) => (
                  <div key={f.title} className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-lg">{f.icon}</span>
                      <h3 className="text-sm font-semibold text-slate-900">{f.title}</h3>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{f.body}</p>
                  </div>
                ))}
              </div>
            </motion.section>

            {/* API reference */}
            <motion.section variants={item} className="mb-10">
              <SectionHeading eyebrow="Integrate" title="API reference" />
              <div className="space-y-3">
                {apiEndpoints.map((g) => (
                  <ApiGroup key={g.group} group={g} />
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-3">
                "Requires login" routes need an <code className="font-mono">Authorization: Bearer &lt;accessToken&gt;</code> header.
              </p>
            </motion.section>

            {/* AI chat assistant */}
            <motion.section variants={item} className="mb-10">
              <SectionHeading eyebrow="Under the hood" title="The AI chat assistant" />
              <div className="rounded-2xl border border-orange-200 bg-gradient-to-b from-orange-50/60 to-white p-4 sm:p-5 space-y-4">
                {chatAssistant.map((c) => (
                  <div key={c.title}>
                    <h3 className="text-sm font-semibold text-orange-700 mb-1">{c.title}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{c.body}</p>
                  </div>
                ))}
              </div>
            </motion.section>

            {/* Moderation */}
            <motion.section variants={item} className="mb-10">
              <SectionHeading eyebrow="Anti-abuse" title="Moderation" />
              <ul className="space-y-2.5">
                {moderation.map((m) => (
                  <li key={m} className="flex items-start gap-2.5 text-sm text-slate-600 leading-relaxed">
                    <span className="text-emerald-600"><CheckIcon /></span>
                    {m}
                  </li>
                ))}
              </ul>
            </motion.section>

            {/* Security */}
            <motion.section variants={item} className="mb-10">
              <SectionHeading eyebrow="Trust" title="Security" />
              <ul className="space-y-2.5">
                {security.map((s) => (
                  <li key={s} className="flex items-start gap-2.5 text-sm text-slate-600 leading-relaxed">
                    <span className="text-emerald-600"><CheckIcon /></span>
                    {s}
                  </li>
                ))}
              </ul>
            </motion.section>

            {/* Contributing */}
            <motion.section variants={item} className="mb-10">
              <SectionHeading eyebrow="Join in" title="Contributing" />
              <div className="space-y-3">
                {contributing.map((c) => (
                  <p key={c} className="text-sm text-slate-600 leading-relaxed">{c}</p>
                ))}
              </div>
            </motion.section>

            {/* Roadmap note */}
            <motion.div variants={item} className="rounded-xl bg-slate-900 text-white p-5 mb-8">
              <h3 className="text-sm font-semibold mb-1.5">Still going</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                TrainMitra is being built one step at a time, out in the open. Nothing here is final - features
                get added, reworked, and sometimes reverted as the project grows. Check back on this page
                whenever you're curious what's changed.
              </p>
            </motion.div>

            <motion.div variants={item} className="pt-6 border-t border-slate-200">
              <p className="text-sm text-slate-400">Designed &amp; developed by Kaushik Banik</p>
            </motion.div>
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
