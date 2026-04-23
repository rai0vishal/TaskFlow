import { useState, useEffect, useCallback, useRef, memo, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { getDashboardData } from '../api/analytics';
import * as inviteApi from '../api/invites';
import { getTasks } from '../api/tasks';
import { customToast as toast } from '../components/ToastSystem';
import {
  Check, X, CheckCircle2, Clock, AlertCircle, ListTodo, TrendingUp, Activity, 
  ArrowUpRight, CalendarDays, Zap, Plus, Users, PlusCircle, Pencil, Trash2, LayoutGrid, ArrowRight
} from 'lucide-react';
import InviteModal from '../components/InviteModal';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area,
} from 'recharts';

/* ─── Custom Tooltip (memoized) ─── */
const CustomTooltip = memo(function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-bg-card border-[0.5px] border-border rounded-[var(--radius-sm)] shadow-xl px-4 py-3 min-w-[150px]">
      <p className="text-[11px] font-[600] text-text-muted mb-2 uppercase">{label}</p>
      <div className="space-y-1">
        {payload.map((entry, i) => (
          <div key={i} className="flex items-center justify-between gap-5">
            <span className="flex items-center gap-2 text-[12px] font-[500] text-text-body">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: entry.color }} />
              {entry.name}
            </span>
            <span className="text-[14px] font-[700] text-text-heading">{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
});

/* ─── Animated Counter ─── */
function StatCounter({ value }) {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    let startTime;
    const duration = 600;
    const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
    
    const animate = (time) => {
      if (!startTime) startTime = time;
      const progress = Math.min((time - startTime) / duration, 1);
      
      setCount(Math.floor(value * easeOutCubic(progress)));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(value);
      }
    };
    
    requestAnimationFrame(animate);
  }, [value]);
  
  return <>{count}</>;
}

/* ─── Activity Action Icons ─── */
const ACTION_ICONS = {
  created: { icon: PlusCircle, color: 'text-success' },
  updated: { icon: Pencil, color: 'text-info' },
  completed: { icon: Check, color: 'text-primary' },
  deleted: { icon: Trash2, color: 'text-danger' },
};

export default function Dashboard() {
  const { user } = useAuth();
  const { socket, joinWorkspaceRoom } = useSocket();
  const { activeWorkspace, isSwitching, loadingWorkspace } = useWorkspace();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({ total: 0, todo: 0, inProgress: 0, done: 0 });
  const [recentActivities, setRecentActivities] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const debounceRef = useRef(null);

  const [urgentTasks, setUrgentTasks] = useState({ overdue: [], dueToday: [] });
  const [dismissedBanners, setDismissedBanners] = useState(() => {
    try { return JSON.parse(localStorage.getItem('dismissedBanners')) || {}; } catch { return {}; }
  });

  const dismissBanner = (id) => {
    const newDismissed = { ...dismissedBanners, [id]: Date.now() };
    setDismissedBanners(newDismissed);
    localStorage.setItem('dismissedBanners', JSON.stringify(newDismissed));
  };

  const isDismissed = (id) => {
    const time = dismissedBanners[id];
    if (!time) return false;
    return (Date.now() - time) < 24 * 60 * 60 * 1000; // 24h
  };

  useEffect(() => {
    const fetchInvites = async () => {
      try {
        const { data } = await inviteApi.getPendingInvites();
        setPendingInvites(data.data.invites);
      } catch (err) {}
    };
    fetchInvites();
  }, []);

  const handleAcceptInvite = async (inviteId) => {
    try {
      await inviteApi.acceptInvite({ inviteId });
      toast.success('Joined Workspace 🎉');
      setPendingInvites(prev => prev.filter(inv => inv._id !== inviteId));
      window.location.reload();
    } catch (err) {}
  };

  const handleRejectInvite = async (inviteId) => {
    try {
      await inviteApi.rejectInvite({ inviteId });
      toast.info('Invite rejected');
      setPendingInvites(prev => prev.filter(inv => inv._id !== inviteId));
    } catch (err) {}
  };

  const fetchData = useCallback(async () => {
    if (!activeWorkspace?._id) return;
    try {
      const { data } = await getDashboardData(activeWorkspace._id);
      const payload = data.data;
      setStats(payload.stats);
      setRecentActivities(payload.recentActivities);
      setWeeklyData(payload.weeklyProductivity);
      
      // Fetch urgent tasks for banners
      const taskRes = await getTasks({ workspace: activeWorkspace._id });
      const tasks = taskRes.data?.data?.tasks || [];
      const now = new Date();
      now.setHours(0,0,0,0);
      const overdue = [], dueToday = [];
      tasks.forEach(t => {
        if (t.status === 'completed' || !t.dueDate) return;
        const due = new Date(t.dueDate);
        due.setHours(0,0,0,0);
        const diffDays = (due - now) / (1000*60*60*24);
        if (diffDays < 0) overdue.push(t);
        else if (diffDays === 0) dueToday.push(t);
      });
      setUrgentTasks({ overdue, dueToday });
    } catch {
    } finally {
      setLoading(false);
    }
  }, [activeWorkspace?._id]);

  const debouncedFetch = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchData(), 500);
  }, [fetchData]);

  useEffect(() => {
    if (loadingWorkspace) return;
    if (isSwitching) {
      setStats({ total: 0, todo: 0, inProgress: 0, done: 0 });
      setRecentActivities([]);
      setWeeklyData([]);
      return;
    }
    if (activeWorkspace?._id) {
      setLoading(true);
      fetchData();
    } else {
      setLoading(false);
    }
  }, [fetchData, isSwitching, activeWorkspace?._id, loadingWorkspace]);

  useEffect(() => {
    if (activeWorkspace?._id) {
      joinWorkspaceRoom(activeWorkspace._id);
    }
  }, [activeWorkspace?._id, joinWorkspaceRoom]);

  useEffect(() => {
    if (!socket) return;
    socket.on('taskCreated', debouncedFetch);
    socket.on('taskUpdated', debouncedFetch);
    socket.on('taskMoved', debouncedFetch);
    socket.on('taskDeleted', debouncedFetch);
    socket.on('task_assigned', debouncedFetch);
    return () => {
      socket.off('taskCreated', debouncedFetch);
      socket.off('taskUpdated', debouncedFetch);
      socket.off('taskMoved', debouncedFetch);
      socket.off('taskDeleted', debouncedFetch);
      socket.off('task_assigned', debouncedFetch);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [socket, debouncedFetch]);

  useEffect(() => {
    const openInvite = () => setShowInviteModal(true);
    window.addEventListener('open-invite', openInvite);
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'invite') {
      setShowInviteModal(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    return () => window.removeEventListener('open-invite', openInvite);
  }, []);

  const completionRate = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

  const getGreeting = () => {
    const hour = new Date().getHours();
    let timeGreeting = 'Good evening';
    if (hour >= 5 && hour < 12) timeGreeting = 'Good morning';
    else if (hour >= 12 && hour < 17) timeGreeting = 'Good afternoon';
    return timeGreeting;
  };
  
  const getSubtitle = () => {
    if (stats.total === 0) return "Ready to start? Create your first task.";
    if (stats.inProgress >= 4) return `Busy day ahead — ${stats.inProgress} tasks to work through.`;
    return `You have ${stats.inProgress} tasks in progress. Keep it up!`;
  };

  const statCards = useMemo(() => [
    { label: 'Total Tasks', value: stats.total, filter: 'all', bg: 'bg-primary-light', color: 'text-primary' },
    { label: 'To Do', value: stats.todo, filter: 'todo', bg: 'bg-warning-bg', color: 'text-warning' },
    { label: 'In Progress', value: stats.inProgress, filter: 'in_progress', bg: 'bg-info-bg', color: 'text-info' },
    { label: 'Completed', value: stats.done, filter: 'completed', bg: 'bg-success-bg', color: 'text-success' },
  ], [stats]);

  const showEmptyState = !loading && stats.total === 0;

  return (
    <div className="font-sans min-h-screen bg-transparent transition-colors duration-300 page-wrapper">
      <main className="max-w-7xl mx-auto px-[32px] max-sm:px-[16px] py-8">

        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-8">
          <div>
            <h1 className="text-[28px] font-[700] text-text-heading leading-tight flex items-center gap-2">
              <span className="text-[28px]" role="img" aria-label="wave">👋</span>
              {getGreeting()}, {user?.name?.split(' ')[0]}
            </h1>
            <p className="mt-2 text-text-muted text-[14px] font-[400] flex items-center gap-1.5 leading-relaxed">
              {getSubtitle()}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/tasks?action=new-task"
              className="inline-flex items-center justify-center font-[600] text-[14px] px-[20px] py-[9px] rounded-[var(--radius-sm)] bg-transparent text-primary border-[1.5px] border-primary hover:bg-primary-light transition-all active:scale-[0.98]"
            >
              <Plus className="w-4 h-4 mr-2" /> New Task
            </Link>
            <Link
              to="/tasks"
              className="inline-flex items-center justify-center font-[600] text-[14px] px-[20px] py-[9px] rounded-[var(--radius-sm)] bg-primary text-white border-none hover:bg-primary-dark transition-all active:scale-[0.98]"
            >
              Task Board <ArrowUpRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </div>

        {/* Urgent Alerts */}
        {!loading && activeWorkspace && (
          <div className="space-y-3 mb-8">
            {urgentTasks.overdue.length > 0 && !isDismissed('overdue') && (
              <div className="bg-danger-bg border-[0.5px] border-danger-border rounded-[var(--radius-sm)] p-4 flex justify-between items-center animate-in slide-in-from-top-2">
                <div className="flex items-center gap-3">
                  <AlertCircle className="text-danger w-5 h-5" />
                  <span className="text-danger text-[14px] font-[500]">You have {urgentTasks.overdue.length} overdue task(s).</span>
                </div>
                <button onClick={() => dismissBanner('overdue')} className="text-danger hover:opacity-70"><X className="w-4 h-4" /></button>
              </div>
            )}
            {urgentTasks.dueToday.length > 0 && !isDismissed('dueToday') && (
              <div className="bg-warning-bg border-[0.5px] border-warning-border rounded-[var(--radius-sm)] p-4 flex justify-between items-center animate-in slide-in-from-top-2">
                <div className="flex items-center gap-3">
                  <Clock className="text-warning w-5 h-5" />
                  <span className="text-warning text-[14px] font-[500]">You have {urgentTasks.dueToday.length} task(s) due today.</span>
                </div>
                <button onClick={() => dismissBanner('dueToday')} className="text-warning hover:opacity-70"><X className="w-4 h-4" /></button>
              </div>
            )}
          </div>
        )}

        {/* Pending Invitations */}
        {pendingInvites.length > 0 && (
          <div className="mb-8 bg-bg-surface border-[0.5px] border-border rounded-[var(--radius-md)] p-6">
            <h2 className="text-[16px] font-[600] text-text-heading mb-4">Pending Invites</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingInvites.map((invite) => (
                <div key={invite._id} className="bg-bg-card border-[0.5px] border-border rounded-[var(--radius-sm)] p-4 flex flex-col justify-between">
                  <div className="mb-4">
                    <h3 className="font-[600] text-text-heading text-[16px]">{invite.workspace?.name}</h3>
                    <p className="text-[12px] text-text-muted mt-1">Invited by {invite.sender?.name}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleAcceptInvite(invite._id)} className="flex-1 bg-primary text-white text-[12px] font-[600] py-2 rounded-[var(--radius-sm)] hover:bg-primary-dark transition-colors">Accept</button>
                    <button onClick={() => handleRejectInvite(invite._id)} className="flex-1 bg-transparent text-text-body border-[0.5px] border-border text-[12px] font-[600] py-2 rounded-[var(--radius-sm)] hover:bg-bg-surface transition-colors">Reject</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dashboard Content */}
        {!activeWorkspace && !loading ? (
          <div className="text-center py-20 bg-bg-card border-[0.5px] border-border rounded-[var(--radius-md)] mt-8">
            <LayoutGrid className="w-16 h-16 text-text-hint mx-auto mb-5" />
            <h3 className="text-[22px] font-[600] text-text-heading mb-2">No active workspace</h3>
            <p className="text-[14px] text-text-body max-w-sm mx-auto">
              Please select or create a workspace from the top menu to see your productivity metrics.
            </p>
          </div>
        ) : (
          <>
            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-[16px] mb-[16px]">
              {loading ? (
                [1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-[80px] w-full" />)
              ) : (
                statCards.map((stat) => (
                  <div
                    key={stat.label}
                    onClick={() => navigate(`/tasks?filter=${stat.filter}`)}
                    className={`group ${stat.bg} rounded-[var(--radius-md)] p-5 cursor-pointer flex flex-col justify-center relative overflow-hidden transition-all duration-150 border-[0.5px] border-transparent hover:border-primary hover:-translate-y-[2px]`}
                  >
                    <p className={`text-[28px] font-[700] ${stat.color} leading-none mb-1`}>
                      <StatCounter value={stat.value} />
                    </p>
                    <p className="text-[12px] font-[500] text-text-muted">{stat.label}</p>
                    <ArrowRight className={`absolute bottom-4 right-4 w-4 h-4 ${stat.color} opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1`} />
                  </div>
                ))
              )}
            </div>

            {/* Visualizations & Lists */}
            {showEmptyState ? (
              <div className="bg-bg-card border-[0.5px] border-border rounded-[var(--radius-md)] p-8 max-w-2xl mx-auto mt-8 text-center animate-in fade-in zoom-in-95">
                <h3 className="text-[22px] font-[600] text-text-heading mb-6">Get started with TaskFlow</h3>
                
                <div className="w-full h-[4px] bg-border rounded-full mb-8 overflow-hidden relative">
                  <div className="absolute top-0 left-0 h-full bg-primary" style={{ animation: 'barFill 600ms ease-out 50ms forwards', width: '0%' }} />
                </div>
                <style>{`@keyframes barFill { to { width: 33%; } }`}</style>
                
                <div className="space-y-4 text-left inline-block max-w-sm w-full mx-auto">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full border-[1.5px] border-primary bg-primary-light flex items-center justify-center"><Check className="w-3 h-3 text-primary" /></div>
                    <span className="text-[14px] text-text-body line-through opacity-70">Create workspace</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full border-[1.5px] border-border" />
                    <span className="text-[14px] text-text-heading font-[500]">Create first task</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full border-[1.5px] border-border" />
                    <span className="text-[14px] text-text-body">Set a due date</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full border-[1.5px] border-border" />
                    <span className="text-[14px] text-text-body">Move to In Progress</span>
                  </div>
                </div>
                <div className="mt-8">
                  <Link to="/tasks?action=new-task" className="inline-block bg-primary text-white font-[600] text-[14px] px-[20px] py-[9px] rounded-[var(--radius-sm)] hover:bg-primary-dark transition-colors">
                    Create first task
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-[16px] mb-[16px]">
                <div className="lg:col-span-1 bg-bg-card border-[0.5px] border-border rounded-[var(--radius-md)] p-6 flex flex-col items-center justify-center">
                  <p className="text-[16px] font-[600] text-text-heading w-full text-left mb-6">Completion Rate</p>
                  <div className="relative w-32 h-32 mb-6">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15.5" fill="none" strokeWidth="3" className="stroke-border" />
                      <circle
                        cx="18" cy="18" r="15.5" fill="none"
                        stroke="var(--color-primary)"
                        strokeWidth="3.5"
                        strokeDasharray="100, 100"
                        strokeDashoffset="100"
                        strokeLinecap="round"
                        style={{
                          animation: `dashOffset 800ms ease-out forwards`,
                          '--target-offset': 100 - completionRate
                        }}
                      />
                    </svg>
                    <style>{`@keyframes dashOffset { to { stroke-dashoffset: var(--target-offset); } }`}</style>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-[28px] font-[700] text-text-heading leading-none">
                        {loading ? '—' : `${completionRate}%`}
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-[4px] bg-border rounded-full overflow-hidden">
                    <div className="h-full bg-primary transition-all duration-600 ease-out" style={{ width: `${completionRate}%` }} />
                  </div>
                </div>

                <div className="lg:col-span-2 bg-bg-card border-[0.5px] border-border rounded-[var(--radius-md)] overflow-hidden flex flex-col">
                  <div className="px-6 py-4 border-b-[0.5px] border-border flex items-center justify-between">
                    <h2 className="text-[16px] font-[600] text-text-heading">Weekly Productivity</h2>
                  </div>
                  <div className="p-5">
                    {loading ? (
                      <div className="skeleton h-[280px] w-full" />
                    ) : weeklyData.length === 0 ? (
                      <div className="w-full h-[280px] flex items-center justify-center text-text-muted text-[14px]">No data this week</div>
                    ) : (
                      <div style={{ width: '100%', height: '280px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                              <linearGradient id="gradCompleted" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                                <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                              </linearGradient>
                              <linearGradient id="gradCreated" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="var(--color-info)" stopOpacity={0.2} />
                                <stop offset="100%" stopColor="var(--color-info)" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--color-border-light)" />
                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} dy={8} />
                            <YAxis axisLine={false} tickLine={false} allowDecimals={false} tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} />
                            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--color-border)', strokeWidth: 1.5, strokeDasharray: '4 4' }} />
                            <Legend iconType="circle" iconSize={5} wrapperStyle={{ fontSize: '12px', color: 'var(--color-text-body)' }} />
                            <Area type="monotone" dataKey="created" name="Created" stroke="var(--color-info)" strokeWidth={2} fill="url(#gradCreated)" dot={{ r: 5, fill: 'var(--color-info)' }} activeDot={{ r: 6 }} />
                            <Area type="monotone" dataKey="completed" name="Completed" stroke="var(--color-primary)" strokeWidth={2} fill="url(#gradCompleted)" dot={{ r: 5, fill: 'var(--color-primary)' }} activeDot={{ r: 6 }} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="w-full bg-bg-card border-[0.5px] border-border rounded-[var(--radius-md)] overflow-hidden">
              <div className="px-6 py-4 border-b-[0.5px] border-border flex items-center justify-between">
                <h2 className="text-[16px] font-[600] text-text-heading">Activity Timeline</h2>
              </div>

              {loading ? (
                <div className="p-6 space-y-4">
                  {[1, 2, 3].map((i) => <div key={i} className="skeleton h-[40px] w-full" />)}
                </div>
              ) : recentActivities.length === 0 ? (
                <div className="p-8 text-center text-text-muted text-[14px]">
                  No activity yet.
                </div>
              ) : (
                <div className="max-h-[300px] overflow-y-auto px-6 py-4">
                  <div className="space-y-4">
                    {recentActivities.map((activity) => {
                      const actionType = ACTION_ICONS[activity.action] || ACTION_ICONS.updated;
                      const IconComp = actionType.icon;
                      
                      return (
                        <div key={activity._id} className="flex items-start gap-4">
                          <IconComp className={`w-5 h-5 mt-0.5 shrink-0 ${actionType.color}`} />
                          <div className="flex-1">
                            <p className="text-[14px] text-text-body leading-snug">
                              <span className="font-[600] text-text-heading">{activity.performedBy?.name || 'User'}</span>
                              {' '}{activity.action}{' '}
                              <span className="font-[500] text-text-heading">"{activity.task?.title || 'Task'}"</span>
                            </p>
                            <p className="text-[11px] text-text-hint mt-1">
                              {new Date(activity.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      <InviteModal isOpen={showInviteModal} onClose={() => setShowInviteModal(false)} workspace={activeWorkspace} />
    </div>
  );
}
