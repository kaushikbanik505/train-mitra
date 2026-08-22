import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import Footer from '../components/Footer';
import SkyBackground, { skyTheme } from '../components/SkyBackground';
import useTimeOfDay from '../hooks/useTimeOfDay';
import { useAuth } from '../context/AuthContext';
import { isAdmin } from '../constants/access';
import client from '../api/client';

function ShieldIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h16Z" />
    </svg>
  );
}

function BackArrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M11 18l-6-6 6-6" />
    </svg>
  );
}

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'online', label: 'Online' },
  { key: 'moderation', label: 'Moderation' },
  { key: 'users', label: 'Users' },
];

function StatCard({ label, value, isDark }) {
  return (
    <div className={`rounded-2xl border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white'}`}>
      <p className={`text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{label}</p>
      <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{value}</p>
    </div>
  );
}

function DeleteButton({ onConfirm, isDark }) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          type="button"
          onClick={() => { setConfirming(false); onConfirm(); }}
          className="text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-600 text-white hover:bg-rose-700 transition-colors"
        >
          Confirm delete
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${isDark ? 'text-slate-300 hover:bg-white/10' : 'text-slate-500 hover:bg-slate-100'}`}
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      aria-label="Delete"
      className={`flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full transition-colors ${
        isDark ? 'text-rose-300 hover:bg-rose-500/10' : 'text-rose-500 hover:bg-rose-50'
      }`}
    >
      <TrashIcon />
    </button>
  );
}

function OverviewTab({ isDark }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    client.get('/admin/overview')
      .then((res) => setData(res.data))
      .catch(() => setError('Could not load overview data.'));
  }, []);

  if (error) return <p className={`text-sm ${isDark ? 'text-rose-300' : 'text-rose-600'}`}>{error}</p>;
  if (!data) return <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Loading...</p>;

  const chartData = [
    { name: 'Delay reports', value: data.delayReportsToday },
    { name: 'Live updates', value: data.liveStatusToday },
    { name: 'Tatkal exp.', value: data.tatkalExperienceTotal },
    { name: 'Journey exp.', value: data.journeyExperienceTotal },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <StatCard label="Registered users" value={data.users} isDark={isDark} />
        <StatCard label="Online now" value={data.onlineNow} isDark={isDark} />
        <StatCard label="Delay reports today" value={data.delayReportsToday} isDark={isDark} />
        <StatCard label="Live updates today" value={data.liveStatusToday} isDark={isDark} />
        <StatCard label="Tatkal exp. (all-time)" value={data.tatkalExperienceTotal} isDark={isDark} />
        <StatCard label="Journey exp. (all-time)" value={data.journeyExperienceTotal} isDark={isDark} />
      </div>

      <div className={`rounded-2xl border p-4 sm:p-5 ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white'}`}>
        <p className={`text-xs font-semibold uppercase tracking-wide mb-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Activity right now, by type
        </p>
        <p className={`text-xs mb-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          Delay reports and live updates reset at midnight IST, so this compares "today's total" against the
          long-running Tatkal/Journey experience totals, not a multi-day trend.
        </p>
        <div style={{ width: '100%', height: 220 }}>
          <ResponsiveContainer>
            <BarChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }} />
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 8,
                  background: isDark ? '#1e293b' : '#fff',
                  border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0',
                  color: isDark ? '#e2e8f0' : '#1e293b',
                }}
              />
              <Bar dataKey="value" fill="#f97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function OnlineTab({ isDark }) {
  const [users, setUsers] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    client.get('/admin/online-users')
      .then((res) => setUsers(res.data))
      .catch(() => setError('Could not load online users.'));
  }, []);

  useEffect(() => {
    load();
    // Presence changes as people connect/disconnect, so poll while this tab is open
    // rather than relying on a one-off fetch.
    const interval = setInterval(load, 8000);
    return () => clearInterval(interval);
  }, [load]);

  if (error) return <p className={`text-sm ${isDark ? 'text-rose-300' : 'text-rose-600'}`}>{error}</p>;
  if (!users) return <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Loading...</p>;

  const namedCount = users.filter((u) => u.name).length;
  const guestCount = users.length - namedCount;

  return (
    <div>
      <p className={`text-xs mb-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
        {namedCount} signed-in {namedCount === 1 ? 'user' : 'users'}, {guestCount} {guestCount === 1 ? 'guest' : 'guests'} &middot; refreshes every few seconds
      </p>
      {users.length === 0 ? (
        <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No one is online right now.</p>
      ) : (
        <div className={`rounded-2xl border overflow-hidden ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white'}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`text-left border-b ${isDark ? 'border-white/10' : 'border-slate-100 bg-slate-50'}`}>
                  <th className={`px-4 py-2.5 font-semibold text-xs uppercase tracking-wide ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Name</th>
                  <th className={`px-4 py-2.5 font-semibold text-xs uppercase tracking-wide ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Role</th>
                  <th className={`px-4 py-2.5 font-semibold text-xs uppercase tracking-wide ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Online since</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, idx) => (
                  <tr key={u.userId || `guest-${idx}`} className={`border-b last:border-0 ${isDark ? 'border-white/5' : 'border-slate-50'}`}>
                    <td className={`px-4 py-2.5 font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      {u.name || <span className={isDark ? 'text-slate-500 italic' : 'text-slate-400 italic'}>Guest</span>}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${isDark ? 'bg-white/10 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className={`px-4 py-2.5 whitespace-nowrap ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {new Date(u.connectedAt).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function ReportRow({ report, isDark, fields, onDelete }) {
  return (
    <div className={`rounded-xl border p-3.5 flex items-start gap-3 ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white'}`}>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-1.5 mb-1">
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded font-mono ${isDark ? 'bg-white/10 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
            #{report.trainNumber}
          </span>
          {fields.badge && fields.badge(report)}
          <span className={`text-[11px] ${isDark ? 'text-emerald-300' : 'text-emerald-600'}`}>▲{report.upvotes}</span>
          <span className={`text-[11px] ${isDark ? 'text-rose-300' : 'text-rose-600'}`}>▼{report.downvotes}</span>
        </div>
        <p className={`text-sm ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{fields.text(report)}</p>
        <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          {report.reportedBy?.name || 'Unknown'} &middot; {report.reportedBy?.email || 'n/a'}
        </p>
      </div>
      <DeleteButton isDark={isDark} onConfirm={() => onDelete(report._id)} />
    </div>
  );
}

function ModerationTab({ isDark }) {
  const [delayReports, setDelayReports] = useState(null);
  const [liveStatus, setLiveStatus] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    Promise.all([client.get('/admin/delay-reports'), client.get('/admin/live-status')])
      .then(([dr, ls]) => {
        setDelayReports(dr.data);
        setLiveStatus(ls.data);
      })
      .catch(() => setError('Could not load moderation data.'));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleDeleteDelay(id) {
    await client.delete(`/admin/delay-reports/${id}`);
    setDelayReports((prev) => prev.filter((r) => r._id !== id));
  }

  async function handleDeleteLive(id) {
    await client.delete(`/admin/live-status/${id}`);
    setLiveStatus((prev) => prev.filter((r) => r._id !== id));
  }

  if (error) return <p className={`text-sm ${isDark ? 'text-rose-300' : 'text-rose-600'}`}>{error}</p>;
  if (!delayReports || !liveStatus) return <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Loading...</p>;

  return (
    <div className="space-y-8">
      <div>
        <p className={`text-xs font-semibold uppercase tracking-wide mb-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Today's delay reports ({delayReports.length}, worst-voted first)
        </p>
        {delayReports.length === 0 ? (
          <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No delay reports posted today.</p>
        ) : (
          <div className="space-y-2.5">
            {delayReports.map((r) => (
              <ReportRow key={r._id} report={r} isDark={isDark} onDelete={handleDeleteDelay} fields={{ text: (r) => r.reason }} />
            ))}
          </div>
        )}
      </div>

      <div>
        <p className={`text-xs font-semibold uppercase tracking-wide mb-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Today's live status updates ({liveStatus.length}, worst-voted first)
        </p>
        {liveStatus.length === 0 ? (
          <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No live status updates posted today.</p>
        ) : (
          <div className="space-y-2.5">
            {liveStatus.map((r) => (
              <ReportRow
                key={r._id}
                report={r}
                isDark={isDark}
                onDelete={handleDeleteLive}
                fields={{
                  text: (r) => r.message,
                  badge: (r) => (
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${isDark ? 'bg-emerald-500/10 text-emerald-300' : 'bg-emerald-50 text-emerald-700'}`}>
                      {r.stationName}{r.platformNumber ? ` · PF ${r.platformNumber}` : ''}
                    </span>
                  ),
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function UsersTab({ isDark, currentUserId }) {
  const [users, setUsers] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    client.get('/admin/users')
      .then((res) => setUsers(res.data))
      .catch(() => setError('Could not load users.'));
  }, []);

  async function handleToggleBan(id) {
    const { data } = await client.patch(`/admin/users/${id}/ban`);
    setUsers((prev) => prev.map((u) => (u._id === id ? { ...u, isBanned: data.isBanned } : u)));
  }

  if (error) return <p className={`text-sm ${isDark ? 'text-rose-300' : 'text-rose-600'}`}>{error}</p>;
  if (!users) return <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Loading...</p>;

  return (
    <div className={`rounded-2xl border overflow-hidden ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white'}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className={`text-left border-b ${isDark ? 'border-white/10' : 'border-slate-100 bg-slate-50'}`}>
              <th className={`px-4 py-2.5 font-semibold text-xs uppercase tracking-wide ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Name</th>
              <th className={`px-4 py-2.5 font-semibold text-xs uppercase tracking-wide ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Email</th>
              <th className={`px-4 py-2.5 font-semibold text-xs uppercase tracking-wide ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Role</th>
              <th className={`px-4 py-2.5 font-semibold text-xs uppercase tracking-wide ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Reputation</th>
              <th className={`px-4 py-2.5 font-semibold text-xs uppercase tracking-wide ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Joined</th>
              <th className={`px-4 py-2.5 font-semibold text-xs uppercase tracking-wide ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Status</th>
              <th className={`px-4 py-2.5 font-semibold text-xs uppercase tracking-wide ${isDark ? 'text-slate-400' : 'text-slate-500'}`}></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} className={`border-b last:border-0 ${isDark ? 'border-white/5' : 'border-slate-50'}`}>
                <td className={`px-4 py-2.5 font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{u.name}</td>
                <td className={`px-4 py-2.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{u.email}</td>
                <td className="px-4 py-2.5">
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${isDark ? 'bg-white/10 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                    {u.role}
                  </span>
                </td>
                <td className={`px-4 py-2.5 tabular-nums ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {u.reputationScore > 0 ? `+${u.reputationScore}` : u.reputationScore}
                </td>
                <td className={`px-4 py-2.5 whitespace-nowrap ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-2.5">
                  {u.isBanned ? (
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${isDark ? 'bg-rose-500/10 text-rose-300' : 'bg-rose-50 text-rose-600'}`}>
                      Banned
                    </span>
                  ) : (
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${isDark ? 'bg-emerald-500/10 text-emerald-300' : 'bg-emerald-50 text-emerald-700'}`}>
                      Active
                    </span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-right">
                  {u.role === 'admin' ? (
                    <span className={`text-xs ${isDark ? 'text-slate-600' : 'text-slate-300'}`}>-</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleToggleBan(u._id)}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full transition-colors ${
                        u.isBanned
                          ? isDark ? 'bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          : isDark ? 'bg-rose-500/10 text-rose-300 hover:bg-rose-500/20' : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                      }`}
                    >
                      {u.isBanned ? 'Unban' : 'Ban'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function NotAdminView({ isDark, loggedIn }) {
  return (
    <div className="flex-1 flex items-center justify-center px-4 py-20">
      <div className={`max-w-sm text-center rounded-2xl border p-8 ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white'}`}>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${isDark ? 'bg-rose-500/10 text-rose-300' : 'bg-rose-50 text-rose-500'}`}>
          <ShieldIcon size={22} />
        </div>
        <h1 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>You are not an admin</h1>
        <p className={`text-sm leading-relaxed mb-5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          {loggedIn
            ? "This page is restricted to TrainMitra's admin account. If you think that's wrong, contact the site owner."
            : 'This page is restricted to the admin account. Log in with an admin account to continue.'}
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full bg-orange-500 text-white hover:bg-orange-600 transition-colors"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const reduceMotion = useReducedMotion();
  const period = useTimeOfDay();
  const isDark = skyTheme[period].isDark;
  const [tab, setTab] = useState('overview');

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

      <div className="relative flex-1 flex flex-col">
        {!isAdmin(user) ? (
          <NotAdminView isDark={isDark} loggedIn={Boolean(user)} />
        ) : (
          <div className="max-w-4xl mx-auto px-4 py-10 sm:py-14 w-full">
            <Link
              to="/"
              className={`inline-flex items-center gap-1.5 text-xs font-semibold transition-colors mb-6 ${
                isDark ? 'text-slate-300 hover:text-orange-300' : 'text-slate-500 hover:text-orange-600'
              }`}
            >
              <BackArrow /> Back to home
            </Link>

            <motion.div initial="hidden" animate="show" variants={container}>
              <motion.div variants={item} className="mb-8">
                <p className="text-xs font-semibold tracking-wide text-rose-400 uppercase mb-2">Admin</p>
                <h1 className={`text-2xl sm:text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Admin dashboard</h1>
                <p className={`text-sm sm:text-base max-w-xl ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  Platform-wide analytics, content moderation, and user management - visible only to the admin account.
                </p>
              </motion.div>

              <motion.div variants={item} className="flex flex-wrap gap-2 mb-6">
                {TABS.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setTab(t.key)}
                    className={`text-sm font-semibold px-4 py-2 rounded-full transition-colors ${
                      tab === t.key
                        ? 'bg-orange-500 text-white'
                        : isDark ? 'bg-white/5 text-slate-300 hover:bg-white/10' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </motion.div>

              <motion.div variants={item}>
                {tab === 'overview' && <OverviewTab isDark={isDark} />}
                {tab === 'online' && <OnlineTab isDark={isDark} />}
                {tab === 'moderation' && <ModerationTab isDark={isDark} />}
                {tab === 'users' && <UsersTab isDark={isDark} currentUserId={user?.id} />}
              </motion.div>
            </motion.div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
