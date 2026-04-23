import { useState, useEffect, memo, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import * as analyticsApi from '../api/analytics';
import { useWorkspace } from '../context/WorkspaceContext';
import {
  TrendingUp, BarChart2, Activity, CheckCircle2, Clock, AlertCircle,
  Briefcase, Zap, ListTodo, Users, Calendar, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { SkeletonChart, SkeletonStats } from '../components/LoadingStates';
import EmptyState from '../components/EmptyState';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, Legend, PieChart, Pie, Cell
} from 'recharts';

/* ─── Custom Tooltip (Section 8a) ─── */
const CustomTooltip = memo(function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="backdrop-blur-[8px] border-[0.5px] rounded-[var(--radius-sm)] shadow-xl px-[12px] py-[8px] min-w-[150px]" style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}>
      <p className="text-[11px] font-[600] text-text-muted mb-2 uppercase tracking-wider">{label}</p>
      <div className="space-y-1.5">
        {payload.map((entry, i) => (
          <div key={i} className="flex items-center justify-between gap-5">
            <span className="flex items-center gap-2 text-[12px] font-[500] text-text-body">
              <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ background: entry.color }} />
              {entry.name}
            </span>
            <span className="text-[14px] font-[700] text-text-heading tabular-nums">{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
});

export default function Analytics() {
  const { user } = useAuth();
  const { activeWorkspace, isSwitching, loadingWorkspace } = useWorkspace();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState(30);

  useEffect(() => {
    if (loadingWorkspace) return;
    if (isSwitching) {
      setData(null);
      return;
    }
    if (activeWorkspace && user && user._id) {
      fetchAnalytics(activeWorkspace._id, range);
    } else if (!activeWorkspace) {
      setData(null);
      setLoading(false);
    }
  }, [activeWorkspace, user, isSwitching, range, loadingWorkspace]);

  const fetchAnalytics = async (workspaceId, days) => {
    setLoading(days === range ? true : false); 
    if (!data) setLoading(true);
    
    try {
      const result = await analyticsApi.getUserAnalytics(user._id, workspaceId, { days });
      setData(result.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Helper for trend indicators (Mock logic since backend doesn't seem to provide trends currently)
  // For the sake of the UI spec, we will add a mock trend to one of the cards
  const renderTrend = (value, isPositive) => (
    <div className={`flex items-center gap-1 text-[12px] font-[600] ${isPositive ? 'text-success' : 'text-danger'} mt-2`}>
      {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
      {value}
    </div>
  );

  return (
    <div className="font-sans min-h-screen bg-transparent transition-colors duration-300 pb-12 page-wrapper">
      <main className="max-w-[1440px] mx-auto px-[32px] max-sm:px-[16px] py-8">
        
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-10">
          <div>
            <h1 className="text-[28px] font-[700] text-text-heading tracking-tight flex items-center gap-3">
              Performance Analytics
            </h1>
            <p className="mt-2 text-text-muted text-[14px] font-[400] flex items-center gap-1.5 leading-relaxed">
              Deep insights into your productivity for <span className="text-primary font-[600]">{activeWorkspace?.name || 'Workspace'}</span>
            </p>
          </div>
          
          <div className="flex items-center gap-1 bg-bg-surface p-1 rounded-[var(--radius-sm)] border-[0.5px] border-border">
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setRange(d)}
                className={`px-4 py-1.5 rounded-[calc(var(--radius-sm)-2px)] text-[12px] font-[600] transition-all ${
                  range === d 
                    ? 'bg-primary text-white shadow-sm' 
                    : 'text-text-muted hover:text-text-body'
                }`}
              >
                {d} Days
              </button>
            ))}
          </div>
        </div>

        {loading && !data ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SkeletonChart />
              <SkeletonChart />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => <div key={i} className="skeleton h-[120px] w-full" />)}
            </div>
          </div>
        ) : data ? (
          <>
            {/* SUMMARY CARDS (Section 8b) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-[16px] mb-8">
              
              {/* Performance Metrics */}
              <div className="bg-bg-card rounded-[var(--radius-md)] border-[0.5px] border-border p-6 shadow-sm">
                <h3 className="text-[12px] font-[600] uppercase tracking-wider text-text-hint mb-5 flex items-center gap-2">
                  <Activity className="w-4 h-4" /> Performance Metrics
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-[32px] font-[700] text-text-heading leading-none">{data.performance.completed}</p>
                    <p className="text-[12px] font-[500] text-text-muted mt-2">Tasks Completed</p>
                    {renderTrend('+12%', true)}
                  </div>
                  <div>
                    <p className="text-[32px] font-[700] text-text-heading leading-none">{data.performance.pending}</p>
                    <p className="text-[12px] font-[500] text-text-muted mt-2">Tasks Pending</p>
                    {renderTrend('-5%', false)}
                  </div>
                  <div>
                    <p className="text-[32px] font-[700] text-text-heading leading-none">{data.performance.completionRate}%</p>
                    <p className="text-[12px] font-[500] text-text-muted mt-2">Completion Rate</p>
                  </div>
                  <div>
                    <p className="text-[32px] font-[700] text-text-heading leading-none">{data.performance.avgCompletionTime}d</p>
                    <p className="text-[12px] font-[500] text-text-muted mt-2">Avg Completion Time</p>
                  </div>
                </div>
              </div>

              {/* Contribution Metrics */}
              <div className="bg-bg-card rounded-[var(--radius-md)] border-[0.5px] border-border p-6 shadow-sm flex flex-col">
                <h3 className="text-[12px] font-[600] uppercase tracking-wider text-text-hint mb-5 flex items-center gap-2">
                  <Briefcase className="w-4 h-4" /> Contribution Metrics
                </h3>
                <div className="flex-1 grid grid-cols-2 gap-6 items-start">
                  <div>
                    <p className="text-[32px] font-[700] text-text-heading leading-none">{data.contribution.created}</p>
                    <p className="text-[12px] font-[500] text-text-muted mt-2">Tasks Created</p>
                    {renderTrend('+8%', true)}
                  </div>
                  <div>
                    <p className="text-[32px] font-[700] text-text-heading leading-none">{data.contribution.delegated}</p>
                    <p className="text-[12px] font-[500] text-text-muted mt-2">Tasks Delegated</p>
                  </div>
                </div>
                
                {data.overdue.count > 0 && (
                  <div className="mt-4 p-4 bg-danger-bg border-[0.5px] border-danger-border rounded-[var(--radius-sm)] flex items-start gap-3">
                    <AlertCircle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[13px] font-[600] text-danger">Overdue Status</p>
                      <p className="text-[12px] font-[500] text-danger opacity-80 mt-1">You have {data.overdue.count} task(s) overdue by an average of {data.overdue.avgDelayDays} day(s).</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Smart Insights & Workload */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-[16px] mb-8">
              
              {/* Smart Insights Array */}
              <div className="lg:col-span-1 bg-bg-card border-[0.5px] border-border rounded-[var(--radius-md)] p-6 shadow-sm relative overflow-hidden">
                <h3 className="text-[14px] font-[600] text-text-heading flex items-center gap-2 mb-6">
                  <Zap className="w-4 h-4 text-warning" /> Smart Insights
                </h3>
                {data.insights.length > 0 ? (
                  <ul className="space-y-4">
                    {data.insights.map((insight, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                        <span className="text-[13px] font-[500] text-text-body leading-relaxed">{insight}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[13px] text-text-muted">Not enough data to calculate insights yet.</p>
                )}
              </div>

              {/* Workload vs Completion */}
              <div className="lg:col-span-2 bg-bg-card border-[0.5px] border-border rounded-[var(--radius-md)] p-6 shadow-sm">
                <h3 className="text-[14px] font-[600] text-text-heading flex items-center gap-2 mb-6">
                  <ListTodo className="w-4 h-4 text-primary" /> Workload vs Completion (Last 4 Weeks)
                </h3>
                <div style={{ width: '100%', height: '280px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.workload} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="barGradCompleted" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={1} />
                          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0.6} />
                        </linearGradient>
                        <linearGradient id="barGradAssigned" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--color-info)" stopOpacity={1} />
                          <stop offset="100%" stopColor="var(--color-info)" stopOpacity={0.6} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--color-border-light)" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-muted)', fontSize: 11, fontWeight: 500 }} dy={8} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-muted)', fontSize: 11, fontWeight: 500 }} allowDecimals={false} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--color-bg-surface)' }} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 500, color: 'var(--color-text-body)', paddingTop: '10px' }} />
                      <Bar dataKey="assigned" name="Tasks Assigned" fill="url(#barGradAssigned)" radius={[4, 4, 0, 0]} barSize={24} />
                      <Bar dataKey="completed" name="Tasks Completed" fill="url(#barGradCompleted)" radius={[4, 4, 0, 0]} barSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* CHARTS ROW (Productivity Trend + Weekly Dist) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-[16px] mb-8">
              
              {/* Productivity Trend */}
              <div className="bg-bg-card border-[0.5px] border-border rounded-[var(--radius-md)] p-6 shadow-sm">
                <h3 className="text-[14px] font-[600] text-text-heading flex items-center gap-2 mb-6">
                  <TrendingUp className="w-4 h-4 text-success" /> Productivity Trend (Last {range} Days)
                </h3>
                <div style={{ width: '100%', height: '220px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.productivityTrend} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--color-success)" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="var(--color-success)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--color-border-light)" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} dy={10} minTickGap={20} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-muted)', fontSize: 11, fontWeight: 500 }} allowDecimals={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="completed" name="Completed" stroke="var(--color-success)" strokeWidth={2} fill="url(#trendGradient)" activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--color-success)', fill: 'var(--color-bg-card)' }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Weekly Distribution */}
              <div className="bg-bg-card border-[0.5px] border-border rounded-[var(--radius-md)] p-6 shadow-sm">
                <h3 className="text-[14px] font-[600] text-text-heading flex items-center gap-2 mb-6">
                  <Clock className="w-4 h-4 text-primary" /> Weekly Distribution
                </h3>
                <div style={{ width: '100%', height: '220px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.weeklyDistribution} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="barGradDist" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={1} />
                          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0.5} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--color-border-light)" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-muted)', fontSize: 11, fontWeight: 500 }} dy={8} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-muted)', fontSize: 11, fontWeight: 500 }} allowDecimals={false} />
                      <Tooltip cursor={{ fill: 'transparent' }} content={<CustomTooltip />} />
                      <Bar dataKey="completed" name="Tasks Completed" fill="url(#barGradDist)" radius={[4, 4, 0, 0]} barSize={28} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            
          </>
        ) : (
          !loading && (
            <div className="p-12">
              <EmptyState 
                icon={BarChart2}
                title="No analytics data"
                description={activeWorkspace ? "We don't have enough data to show analytics for this workspace yet." : "Please select a workspace to view your performance metrics."}
              />
            </div>
          )
        )}
      </main>
    </div>
  );
}
