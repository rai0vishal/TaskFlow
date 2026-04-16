import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { getDashboardData } from '../api/analytics';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  ListTodo,
  TrendingUp,
  Activity,
  ArrowUpRight,
  CalendarDays,
  Zap,
  Plus,
  Users,
  PlusCircle,
  Pencil,
  Trash2,
} from 'lucide-react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
} from 'recharts';

/* ─── Custom Tooltip ─── */
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/95 dark:bg-surface-800/95 backdrop-blur-sm border border-surface-200/80 dark:border-surface-700/80 rounded-xl shadow-2xl shadow-surface-900/10 dark:shadow-surface-950/30 px-4 py-3.5 min-w-[150px]">
      <p className="text-[10px] font-bold text-surface-400 dark:text-surface-500 mb-2.5 uppercase tracking-[0.12em]">{label}</p>
      <div className="space-y-1.5">
        {payload.map((entry, i) => (
          <div key={i} className="flex items-center justify-between gap-5">
            <span className="flex items-center gap-2 text-xs font-semibold text-surface-600 dark:text-surface-300">
              <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ background: entry.color }} />
              {entry.name}
            </span>
            <span className="text-sm font-black text-surface-900 dark:text-white tabular-nums">{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Timeline Dot ─── */
const ACTION_ICONS = {
  created: { icon: PlusCircle, bg: 'bg-emerald-500', ring: 'ring-emerald-500/20' },
  updated: { icon: Pencil, bg: 'bg-blue-500', ring: 'ring-blue-500/20' },
  deleted: { icon: Trash2, bg: 'bg-red-500', ring: 'ring-red-500/20' },
};

export default function Dashboard() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [stats, setStats] = useState({ total: 0, todo: 0, inProgress: 0, done: 0 });
  const [recentActivities, setRecentActivities] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  // Listen to socket events for real-time dashboard updates
  useEffect(() => {
    if (!socket) return;
    const reloadDashboard = () => fetchData();
    
    socket.on('taskCreated', reloadDashboard);
    socket.on('taskUpdated', reloadDashboard);
    socket.on('taskDeleted', reloadDashboard);
    
    return () => {
      socket.off('taskCreated', reloadDashboard);
      socket.off('taskUpdated', reloadDashboard);
      socket.off('taskDeleted', reloadDashboard);
    };
  }, [socket]);

  const fetchData = async () => {
    try {
      const { data } = await getDashboardData();
      const payload = data.data;
      setStats(payload.stats);
      setRecentActivities(payload.recentActivities);
      setWeeklyData(payload.weeklyProductivity);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  const completionRate = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const statCards = [
    { label: 'Total Tasks', value: stats.total, icon: ListTodo,
      iconBg: 'bg-primary-100 dark:bg-primary-900/40', iconColor: 'text-primary-600 dark:text-primary-400',
      accent: 'group-hover:border-primary-300 dark:group-hover:border-primary-700' },
    { label: 'To Do', value: stats.todo, icon: Clock,
      iconBg: 'bg-amber-100 dark:bg-amber-900/40', iconColor: 'text-amber-600 dark:text-amber-400',
      accent: 'group-hover:border-amber-300 dark:group-hover:border-amber-700' },
    { label: 'In Progress', value: stats.inProgress, icon: TrendingUp,
      iconBg: 'bg-blue-100 dark:bg-blue-900/40', iconColor: 'text-blue-600 dark:text-blue-400',
      accent: 'group-hover:border-blue-300 dark:group-hover:border-blue-700' },
    { label: 'Completed', value: stats.done, icon: CheckCircle2,
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/40', iconColor: 'text-emerald-600 dark:text-emerald-400',
      accent: 'group-hover:border-emerald-300 dark:group-hover:border-emerald-700' },
  ];

  return (
    <div className="font-sans min-h-screen bg-surface-100 dark:bg-surface-950 transition-colors duration-300">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">

        {/* ═══════════════════════════════════
            HEADER + QUICK ACTIONS
        ═══════════════════════════════════ */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl" role="img" aria-label="wave">👋</span>
              <p className="text-xs font-semibold text-surface-400 dark:text-surface-500 tracking-wide">
                {getGreeting()}
              </p>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-surface-900 dark:text-white tracking-tight leading-tight">
              {user?.name}
            </h1>
            <p className="mt-2 text-surface-500 dark:text-surface-400 text-sm font-medium flex items-center gap-1.5 leading-relaxed">
              <CalendarDays className="w-3.5 h-3.5" />
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              <span className="mx-1 text-surface-300 dark:text-surface-600">·</span>
              Here&apos;s your productivity overview
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3">
            <Link
              to="/tasks"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 text-sm font-bold hover:bg-surface-200 dark:hover:bg-surface-700 hover:scale-105 transition-all duration-200 active:scale-95 border border-surface-200/60 dark:border-surface-700/60"
            >
              <Plus className="w-4 h-4" /> New Task
            </Link>
            <Link
              to="/tasks"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-bold hover:bg-primary-700 shadow-md shadow-primary-500/25 hover:shadow-lg hover:shadow-primary-500/30 hover:scale-105 transition-all duration-200 active:scale-95"
            >
              <Zap className="w-4 h-4" /> Task Board <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </div>
        </div>

        {/* ═══════════════════════════════════
            STAT CARDS
        ═══════════════════════════════════ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 mb-8">
          {statCards.map((stat) => (
            <div
              key={stat.label}
              className={`group bg-gradient-to-b from-white to-surface-50/30 dark:from-surface-900 dark:to-surface-950/50 border border-surface-200/80 dark:border-surface-800/80 rounded-2xl p-6 shadow-lg shadow-surface-200/40 dark:shadow-black/40 ring-1 ring-black/5 dark:ring-white/5 hover:shadow-xl hover:shadow-surface-300/50 dark:hover:shadow-black/60 hover:scale-[1.02] transition-all duration-300 cursor-default ${stat.accent}`}
            >
              {/* Icon */}
              <div
                className={`w-11 h-11 rounded-full ${stat.iconBg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}
              >
                <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
              </div>

              {/* Number */}
              <p className="text-4xl font-black text-surface-900 dark:text-white tracking-tight leading-none mb-2">
                {loading ? (
                  <span className="inline-block w-12 h-9 bg-surface-100 dark:bg-surface-800 rounded-lg animate-pulse" />
                ) : (
                  stat.value
                )}
              </p>

              {/* Label */}
              <p className="text-xs font-medium text-surface-500 dark:text-surface-400 tracking-wide">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* ═══════════════════════════════════
            COMPLETION RING + CHART
        ═══════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6 mb-8">

          {/* Completion Rate */}
          <div className="lg:col-span-1 bg-gradient-to-b from-white to-surface-50/50 dark:from-surface-900 dark:to-surface-950/80 border border-surface-200/80 dark:border-surface-800/80 rounded-2xl p-6 flex flex-col items-center justify-center shadow-xl shadow-surface-200/40 dark:shadow-black/40 ring-1 ring-black/5 dark:ring-white/5 hover:shadow-2xl hover:shadow-surface-300/50 dark:hover:shadow-black/60 hover:scale-[1.02] transition-all duration-300">
            <p className="text-xs font-semibold text-surface-500 dark:text-surface-400 tracking-wide mb-4">
              Completion Rate
            </p>

            {/* Ring */}
            <div className="relative w-32 h-32 mb-5">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                {/* Track */}
                <circle cx="18" cy="18" r="15.5" fill="none" strokeWidth="3" stroke="#F4F4F5"
                  className="dark:stroke-surface-800" />
                {/* Gradient */}
                <defs>
                  <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#a5b4fc" />
                    <stop offset="50%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#4f46e5" />
                  </linearGradient>
                </defs>
                {/* Progress Arc */}
                <circle
                  cx="18" cy="18" r="15.5" fill="none"
                  stroke="url(#ringGradient)"
                  strokeWidth="3.5"
                  strokeDasharray={`${completionRate}, 100`}
                  strokeLinecap="round"
                  style={{
                    filter: 'drop-shadow(0 0 6px rgba(99, 102, 241, 0.4))',
                    animation: 'ring-fill 1.2s cubic-bezier(0.4, 0, 0.2, 1) forwards',
                  }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-surface-900 dark:text-white tabular-nums leading-none">
                  {loading ? '—' : `${completionRate}%`}
                </span>
                <span className="text-[10px] font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-widest mt-1">
                  Complete
                </span>
              </div>
            </div>

            {/* Stats Row */}
            <div className="flex items-center gap-3 text-xs font-semibold tabular-nums">
              <span className="text-primary-600 dark:text-primary-400 font-bold">{stats.done} done</span>
              <span className="w-1 h-1 rounded-full bg-surface-300 dark:bg-surface-600" />
              <span className="text-surface-500 dark:text-surface-400">{stats.total} total</span>
            </div>
          </div>

          {/* Weekly Productivity Chart */}
          <div className="lg:col-span-2 bg-gradient-to-b from-white to-surface-50/50 dark:from-surface-900 dark:to-surface-950/80 border border-surface-200/80 dark:border-surface-800/80 rounded-2xl overflow-hidden flex flex-col shadow-xl shadow-surface-200/40 dark:shadow-black/40 ring-1 ring-black/5 dark:ring-white/5 hover:shadow-2xl hover:shadow-surface-300/50 dark:hover:shadow-black/60 hover:scale-[1.005] transition-all duration-300">
            <div className="px-6 py-5 border-b border-surface-100 dark:border-surface-800 flex items-center justify-between">
              <h2 className="text-base font-bold text-surface-900 dark:text-white flex items-center gap-2.5">
                <TrendingUp className="w-4.5 h-4.5 text-primary-500" />
                Weekly Productivity
              </h2>
              <span className="text-xs font-medium text-surface-400 dark:text-surface-500 tracking-wide">Last 7 days</span>
            </div>
            <div className="p-5 flex-1 min-h-[280px]">
              {loading ? (
                <div className="w-full h-full bg-surface-50 dark:bg-surface-800/50 animate-pulse rounded-lg" />
              ) : weeklyData.length === 0 ? (
                <div className="w-full h-full flex items-center justify-center text-surface-400 font-medium text-sm">No data this week</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                  <AreaChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradCompleted" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                        <stop offset="50%" stopColor="#6366f1" stopOpacity={0.1} />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradCreated" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#a5b4fc" stopOpacity={0.3} />
                        <stop offset="50%" stopColor="#a5b4fc" stopOpacity={0.08} />
                        <stop offset="100%" stopColor="#a5b4fc" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F4F4F5" className="dark:stroke-surface-800" />
                    <XAxis
                      dataKey="date" axisLine={false} tickLine={false}
                      tick={{ fill: '#A1A1AA', fontSize: 11, fontWeight: 600 }} dy={8}
                    />
                    <YAxis
                      axisLine={false} tickLine={false} allowDecimals={false}
                      tick={{ fill: '#A1A1AA', fontSize: 11, fontWeight: 600 }}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#c7d2fe', strokeWidth: 1.5, strokeDasharray: '4 4' }} />
                    <Legend
                      iconType="circle" iconSize={8}
                      wrapperStyle={{ paddingTop: '16px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.03em' }}
                    />
                    <Area
                      type="natural" dataKey="created" name="Created"
                      stroke="#a5b4fc" strokeWidth={3}
                      fill="url(#gradCreated)" dot={false}
                      activeDot={{ r: 5, strokeWidth: 2.5, stroke: '#a5b4fc', fill: 'white' }}
                    />
                    <Area
                      type="natural" dataKey="completed" name="Completed"
                      stroke="#6366f1" strokeWidth={3}
                      fill="url(#gradCompleted)" dot={false}
                      activeDot={{ r: 5, strokeWidth: 2.5, stroke: '#6366f1', fill: 'white' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════
            ACTIVITY TIMELINE
        ═══════════════════════════════════ */}
        <div className="max-w-3xl mx-auto w-full bg-gradient-to-b from-white to-surface-50/50 dark:from-surface-900 dark:to-surface-950/80 border border-surface-200/80 dark:border-surface-800/80 rounded-2xl overflow-hidden shadow-xl shadow-surface-200/40 dark:shadow-black/40 ring-1 ring-black/5 dark:ring-white/5">
          <div className="px-6 py-5 border-b border-surface-100 dark:border-surface-800 flex items-center justify-between">
            <h2 className="text-base font-bold text-surface-900 dark:text-white flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center">
                <Activity className="w-4 h-4 text-primary-600 dark:text-primary-400" />
              </div>
              Activity Timeline
            </h2>
            <span className="text-xs font-medium text-surface-400 dark:text-surface-500 tracking-wide tabular-nums">
              {recentActivities.length} event{recentActivities.length !== 1 ? 's' : ''}
            </span>
          </div>

          {loading ? (
            <div className="p-6 space-y-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-surface-100 dark:bg-surface-800 animate-pulse shrink-0" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-3.5 w-3/4 bg-surface-100 dark:bg-surface-800 rounded animate-pulse" />
                    <div className="h-3 w-1/3 bg-surface-50 dark:bg-surface-800/50 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentActivities.length === 0 ? (
            <div className="p-10 text-center flex flex-col items-center">
              <div className="w-14 h-14 rounded-xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center mb-3">
                <AlertCircle className="w-7 h-7 text-surface-300 dark:text-surface-600" />
              </div>
              <p className="text-surface-700 dark:text-surface-200 font-bold text-base">No activity yet</p>
              <p className="text-surface-400 dark:text-surface-500 text-xs mt-1 max-w-[240px]">
                Start creating or updating tasks and your feed will populate here.
              </p>
            </div>
          ) : (
            <div className="max-h-[400px] overflow-y-auto">
              <div className="relative px-6 py-5">
                {/* Vertical timeline line */}
                <div className="absolute left-[39px] top-5 bottom-5 w-[2px] bg-gradient-to-b from-surface-200 via-surface-200/80 to-transparent dark:from-surface-700 dark:via-surface-700/60 rounded-full" />

                <div className="space-y-0.5">
                  {recentActivities.map((activity) => {
                    const actionType = ACTION_ICONS[activity.action] || ACTION_ICONS.updated;
                    const IconComp = actionType.icon;
                    const actionLabel = activity.action === 'created' ? 'Created' : activity.action === 'updated' ? 'Updated' : 'Deleted';
                    const actionLabelColor = activity.action === 'created'
                      ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40'
                      : activity.action === 'updated'
                        ? 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40'
                        : 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40';

                    return (
                      <div
                        key={activity._id}
                        className="relative flex items-start gap-3.5 py-3.5 px-2 -mx-2 rounded-lg hover:bg-surface-50/80 dark:hover:bg-surface-800/30 transition-colors duration-150 group"
                      >
                        {/* Timeline Dot */}
                        <div className={`relative z-10 w-8 h-8 rounded-full ${actionType.bg} ring-[3px] ${actionType.ring} dark:ring-opacity-15 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-200 shadow-sm`}>
                          <IconComp className="w-3.5 h-3.5 text-white" />
                        </div>

                        {/* Content */}
                        <div className="min-w-0 pt-1">
                          <p className="text-sm text-surface-600 dark:text-surface-300 leading-relaxed">
                            <span className="font-bold text-surface-900 dark:text-white">
                              {activity.performedBy.name}
                            </span>{' '}
                            <span className={`inline-flex items-center px-1.5 py-[1px] rounded text-[10px] font-bold ${actionLabelColor} mx-0.5`}>
                              {actionLabel}
                            </span>{' '}
                            <span className="font-semibold text-surface-700 dark:text-surface-200">
                              &quot;{activity.task?.title || 'Unknown Task'}&quot;
                            </span>
                          </p>
                          <p className="text-xs text-surface-400 dark:text-surface-500 font-medium mt-1.5 flex items-center gap-1.5">
                            <Clock className="w-3 h-3" />
                            {new Date(activity.createdAt).toLocaleString(undefined, {
                              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                            })}
                          </p>
                        </div>

                        {/* Avatar */}
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-[11px] font-bold text-white shrink-0 shadow-sm ring-2 ring-white dark:ring-surface-900 group-hover:ring-surface-50 dark:group-hover:ring-surface-800/30 transition-all">
                          {activity.performedBy.name.charAt(0).toUpperCase()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
