import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { getUserProfile } from '../api/profile';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Activity, Hexagon, CalendarDays, ListTodo } from 'lucide-react';
import { SkeletonStats, SkeletonChart } from '../components/LoadingStates';
import EmptyState from '../components/EmptyState';
import { customToast as toast } from '../components/ToastSystem';

const TABS = ['Profile', 'Settings', 'Preferences'];

/* ─── Modular Components ─── */
const ProfileHeader = ({ user, joinedDate, workspacesCount, tasksCount }) => (
  <div className="flex flex-col sm:flex-row sm:items-center gap-6 mb-8">
    <div className="w-[80px] h-[80px] rounded-full bg-primary-light flex items-center justify-center shrink-0">
      <span className="text-[32px] font-[700] text-primary">
        {user?.name?.charAt(0).toUpperCase()}
      </span>
    </div>
    <div>
      <h1 className="text-[28px] font-[700] text-text-heading leading-tight capitalize">{user?.name}</h1>
      
      {/* 9a. Profile Stats */}
      <div className="mt-3 flex items-center gap-4 text-[13px] font-[500] text-text-muted">
        <span>Joined {joinedDate}</span>
        <div className="h-4 w-px bg-border" />
        <span>{workspacesCount} Workspace{workspacesCount !== 1 ? 's' : ''}</span>
        <div className="h-4 w-px bg-border" />
        <span>{tasksCount} Total Tasks</span>
      </div>
    </div>
  </div>
);

const StatsCard = ({ label, value }) => (
  <div className="bg-bg-card border-[0.5px] border-border rounded-[var(--radius-md)] p-5 shadow-sm">
    <p className="text-[12px] font-[600] text-text-muted tracking-wider uppercase mb-2">{label}</p>
    <p className="text-[32px] font-[700] text-text-heading">{value}</p>
  </div>
);

export default function Profile() {
  const { user } = useAuth();
  const { setActiveWorkspace, workspaces: globalWorkspaces } = useWorkspace();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Profile');
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    if (user?._id) fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    try {
      const res = await getUserProfile(user._id);
      setData(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleWorkspaceClick = (workspaceId) => {
    const fullWorkspace = globalWorkspaces.find(w => w._id === workspaceId);
    if (fullWorkspace) {
      setActiveWorkspace(fullWorkspace);
      navigate('/tasks');
    }
  };

  const handleDeleteAccount = () => {
    if (deleteConfirmation !== user.email) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 300);
      toast.error('Email confirmation does not match.');
      return;
    }
    toast.info('Account deletion is not supported in this demo.');
  };

  // Memoize heatmap logic
  const heatmapCells = useMemo(() => {
    if (!data?.heatmapData) return [];
    
    return data.heatmapData.map((item, idx) => {
      let intensity = 'bg-bg-surface border-border';
      if (item.count > 0 && item.count <= 2) intensity = 'bg-primary-light border-primary-light opacity-50';
      else if (item.count > 2 && item.count <= 5) intensity = 'bg-primary border-primary opacity-80';
      else if (item.count > 5) intensity = 'bg-primary-dark border-primary-dark';

      return (
        <div
          key={idx}
          className={`w-[14px] h-[14px] rounded-[3px] border-[0.5px] relative group transition-colors duration-200 ${intensity}`}
        >
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-text-heading text-bg-card text-[10px] font-[600] rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap pointer-events-none shadow-xl">
            {item.count} task{item.count !== 1 ? 's' : ''} on {item.date}
          </div>
        </div>
      );
    });
  }, [data?.heatmapData]);

  if (loading) {
    return (
      <div className="font-sans min-h-[calc(100vh-64px)] bg-bg-page transition-colors duration-300 page-wrapper">
        <main className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center gap-6 mb-8 animate-pulse">
            <div className="w-[80px] h-[80px] rounded-full bg-bg-surface" />
            <div className="space-y-3">
              <div className="h-6 w-48 bg-bg-surface rounded" />
              <div className="h-4 w-64 bg-bg-surface rounded" />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-[16px] mb-10">
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="skeleton h-[120px] w-full" />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
              <div className="h-64 bg-bg-card border-[0.5px] border-border rounded-[var(--radius-md)] animate-pulse" />
              <div className="h-48 bg-bg-card border-[0.5px] border-border rounded-[var(--radius-md)] animate-pulse" />
            </div>
            <div className="lg:col-span-2">
              <SkeletonChart />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="font-sans min-h-[calc(100vh-64px)] bg-bg-page transition-colors duration-300 page-wrapper">
      <main className="max-w-[1000px] mx-auto px-[32px] max-sm:px-[16px] py-10">
        
        <ProfileHeader 
          user={data.userInfo || user} 
          joinedDate={new Date(data.userInfo?.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} 
          workspacesCount={data.workspaces.length}
          tasksCount={data.stats.tasksCreated ?? 0}
        />

        {/* 9b. TABS */}
        <div className="bg-bg-surface rounded-[var(--radius-pill)] p-1 inline-flex gap-1 mb-8">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-[calc(var(--radius-pill)-4px)] text-[14px] font-[600] transition-all duration-200 ${
                activeTab === tab 
                  ? 'bg-bg-card text-text-heading shadow-[0_2px_4px_rgba(0,0,0,0.05)]' 
                  : 'text-text-muted hover:text-text-body'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'Profile' && (
          <div className="animate-in fade-in zoom-in-95 duration-200">
            {/* Core Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-[16px] mb-8">
              <StatsCard label="Tasks Created" value={data.stats.tasksCreated ?? 0} />
              <StatsCard label="Assigned To You" value={data.stats.assigned} />
              <StatsCard label="Completed" value={data.stats.completed} />
              <StatsCard label="Completion" value={`${data.stats.completionRate}%`} />
              <div className="bg-primary-light border-[0.5px] border-primary-light rounded-[var(--radius-md)] p-5 flex flex-col justify-center items-start shadow-sm relative overflow-hidden">
                 <Hexagon className="w-20 h-20 text-primary opacity-10 absolute -right-4 -bottom-4 transform rotate-12" />
                 <p className="text-[12px] font-[600] text-primary tracking-wider uppercase mb-1">Performance</p>
                 <p className="text-[20px] font-[700] text-primary leading-tight">{data.performanceTag}</p>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-[16px]">
              
              {/* Left Column: Workspaces Joined */}
              <div className="lg:col-span-1 space-y-4">
                <div className="bg-bg-card border-[0.5px] border-border rounded-[var(--radius-md)] p-6 shadow-sm">
                  <h2 className="text-[14px] font-[600] text-text-heading flex items-center gap-2 mb-4">
                    <Briefcase className="w-4 h-4 text-primary" />
                    Workspaces Joined
                  </h2>
                  
                  <div className="space-y-3">
                    {data.workspaces.length === 0 ? (
                      <EmptyState 
                        icon={Briefcase}
                        title="No workspaces"
                        description="You haven't joined any workspaces yet."
                      />
                    ) : (
                      data.workspaces.map((ws) => (
                        <button
                          key={ws._id}
                          onClick={() => handleWorkspaceClick(ws._id)}
                          className="w-full text-left bg-bg-surface hover:bg-primary-light border-[0.5px] border-border rounded-[var(--radius-md)] p-4 transition-all hover:-translate-y-0.5 group flex items-center justify-between cursor-pointer"
                        >
                          <div>
                            <p className="font-[600] text-[14px] text-text-heading group-hover:text-primary transition-colors">{ws.name}</p>
                            <p className="text-[12px] font-[500] text-text-muted capitalize mt-0.5">{ws.role}</p>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-bg-card border-[0.5px] border-border flex items-center justify-center group-hover:border-primary transition-colors">
                             <span className="text-[12px] font-[700]">{ws.name.charAt(0)}</span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {/* Current Workload overview */}
                <div className="bg-bg-card border-[0.5px] border-border rounded-[var(--radius-md)] p-6 shadow-sm">
                   <h2 className="text-[14px] font-[600] text-text-heading flex items-center gap-2 mb-4">
                    <ListTodo className="w-4 h-4 text-primary" />
                    Current Bottlenecks
                  </h2>
                  <div className="flex items-center justify-between mt-3">
                     <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-warning" />
                        <span className="text-[13px] font-[500] text-text-body">To Do</span>
                     </div>
                     <span className="font-[700] text-[16px] text-text-heading">{data.workload.todo}</span>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                     <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-info" />
                        <span className="text-[13px] font-[500] text-text-body">In Progress</span>
                     </div>
                     <span className="font-[700] text-[16px] text-text-heading">{data.workload.inProgress}</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Heatmap */}
              <div className="lg:col-span-2">
                <div className="bg-bg-card border-[0.5px] border-border rounded-[var(--radius-md)] p-6 shadow-sm overflow-x-auto h-full">
                  <h2 className="text-[14px] font-[600] text-text-heading flex items-center gap-2 mb-6">
                    <Activity className="w-4 h-4 text-primary" />
                    90-Day Contribution Heatmap
                  </h2>
                  
                  <div className="min-w-[650px]">
                    <div className="inline-flex flex-col flex-wrap h-[140px] gap-1 content-start">
                      {heatmapCells.length > 0 ? heatmapCells : (
                        <div className="text-[13px] text-text-muted text-center w-full mt-10">No recent activity</div>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-2 mt-4 text-[12px] font-[500] text-text-muted">
                      <span>Less</span>
                      <div className="flex gap-1">
                        <div className="w-3 h-3 rounded-[2px] bg-bg-surface border border-border" />
                        <div className="w-3 h-3 rounded-[2px] bg-primary-light" />
                        <div className="w-3 h-3 rounded-[2px] bg-primary opacity-80" />
                        <div className="w-3 h-3 rounded-[2px] bg-primary-dark" />
                      </div>
                      <span>More</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {(activeTab === 'Settings' || activeTab === 'Preferences') && (
          <div className="animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-bg-card border-[0.5px] border-border rounded-[var(--radius-md)] p-8 text-center text-text-muted mb-8">
              Settings & Preferences are currently under construction.
            </div>

            {/* 9c. DANGER ZONE */}
            <div className="border-[1.5px] border-dashed border-danger-border bg-danger-bg rounded-[var(--radius-md)] p-6">
              <h3 className="text-[16px] font-[600] text-danger mb-2">Danger Zone</h3>
              <p className="text-[14px] text-danger opacity-80 mb-6">
                Deleting your account is irreversible. Please type <strong>{user?.email}</strong> to confirm.
              </p>
              <div className="flex items-center gap-4 max-w-md">
                <input
                  type="text"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  placeholder="Confirm your email"
                  className={`flex-1 bg-bg-card border-[0.5px] border-danger-border rounded-[var(--radius-sm)] px-[14px] py-[9px] text-[14px] text-text-heading focus:outline-none focus:border-danger focus:shadow-[0_0_0_3px_rgba(239,68,68,0.12)] transition-all ${isShaking ? 'invalid-shake' : ''}`}
                />
                <button
                  onClick={handleDeleteAccount}
                  className="bg-danger text-white border-none font-[600] text-[14px] px-[20px] py-[9px] rounded-[var(--radius-sm)] hover:opacity-90 active:scale-[0.98] hover:-translate-y-[2px] transition-all shrink-0 cursor-pointer"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
