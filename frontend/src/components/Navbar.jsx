import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../hooks/useTheme';
import { LayoutDashboard, ListTodo, LogOut, FolderKanban, MessageSquare, Bell, Clock, AlertCircle, UserPlus, CheckCircle2, Menu, X, BarChart2, Plus, Users } from 'lucide-react';
import Button from './Button';
import { getTasks } from '../api/tasks';
import { useWorkspace } from '../context/WorkspaceContext';
import WorkspaceDropdown from './WorkspaceDropdown';


export default function Navbar() {
  const { user, logout } = useAuth();
  const { isDark, toggle } = useTheme();
  const { activeWorkspace, setActiveWorkspace, workspaces } = useWorkspace();
  const navigate = useNavigate();
  const location = useLocation();

  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const notifRef = useRef(null);
  const quickActionsRef = useRef(null);

  // Close notifications if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (quickActionsRef.current && !quickActionsRef.current.contains(event.target)) {
        setShowQuickActions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch real notifications based on tasks
  useEffect(() => {
    if (!user) return;
    
    const fetchNotifications = async () => {
      if (!activeWorkspace?._id) return;
      try {
        const { data } = await getTasks({ workspace: activeWorkspace._id });
        const tasks = data.data?.tasks || [];
        const now = new Date();
        const activeNotifs = [];

        tasks.forEach(task => {
          if (task.status === 'completed' || !task.dueDate) return;

          const due = new Date(task.dueDate);
          const diffMs = due - now;
          const diffDays = diffMs / (1000 * 60 * 60 * 24);

          if (diffDays < 0) {
            activeNotifs.push({
              id: `overdue-${task._id}`,
              type: 'overdue',
              title: 'Overdue task',
              desc: `Task "${task.title}" is overdue`,
              time: due.toLocaleDateString(),
              unread: true,
              icon: AlertCircle,
              color: 'text-danger',
              bg: 'bg-danger-bg'
            });
          } else if (diffDays <= 2) {
            activeNotifs.push({
              id: `deadline-${task._id}`,
              type: 'deadline',
              title: 'Deadline approaching',
              desc: `Task "${task.title}" is due soon`,
              time: due.toLocaleDateString(),
              unread: true,
              icon: Clock,
              color: 'text-warning',
              bg: 'bg-warning-bg'
            });
          }
        });

        // Only sort if we have items
        setNotifications(activeNotifs.sort((a,b) => b.unread - a.unread));
      } catch (error) {
        console.error('Failed to load real notifications', error);
      }
    };

    fetchNotifications();
  }, [user, activeWorkspace]);

  const unreadNotifs = notifications.filter(n => n.unread).length;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const linkClass = (path) =>
    `flex items-center gap-2 px-[14px] py-[6px] rounded-[var(--radius-sm)] text-[14px] font-medium transition-all duration-200 ${
      location.pathname === path
        ? 'bg-primary-light text-primary'
        : 'text-text-muted hover:text-text-body'
    }`;

  const isHome = location.pathname === '/' && !user;

  return (
    <nav className={`sticky top-0 z-50 transition-colors duration-300 ${
      isHome
        ? 'landing-dark border-b border-white/[0.06]'
        : 'bg-bg-navbar border-b-[0.5px] border-border'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-[32px] h-[32px] rounded-[var(--radius-sm)] bg-primary flex items-center justify-center transition-transform group-hover:scale-105">
              <FolderKanban className="w-5 h-5 text-white" />
            </div>
            <span className={`text-[17px] font-[700] tracking-tight ${
              isHome ? 'text-white' : 'text-text-heading'
            }`}>
              TaskFlow
            </span>
          </Link>

          {/* Navigation - Only show if logged in */}
          {user ? (
            <>
              {/* Center Nav Links */}
              <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1 sm:gap-2">
                <Link to="/dashboard" className={linkClass('/dashboard')}>
                  <LayoutDashboard className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden md:inline">Dashboard</span>
                </Link>
                <Link to="/tasks" className={linkClass('/tasks')}>
                  <ListTodo className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden md:inline">Tasks</span>
                </Link>
                <Link to="/analytics" className={linkClass('/analytics')}>
                  <BarChart2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden md:inline">Analytics</span>
                </Link>
              </div>

               {/* Enhanced Right Menu including Workspace Selector */}
              <div className="flex items-center gap-3 sm:gap-4 ml-auto">
                <div className="hidden sm:block">
                  <WorkspaceDropdown />
                </div>

                {/* Quick Actions */}
                <div className="relative" ref={quickActionsRef}>
                  <button
                    onClick={() => setShowQuickActions(!showQuickActions)}
                    className="w-8 h-8 bg-primary text-white rounded-[var(--radius-sm)] hover:bg-primary-dark transition-all flex items-center justify-center shrink-0"
                    title="Quick Actions"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  
                  {showQuickActions && (
                    <div className="absolute right-0 mt-3 w-48 bg-bg-card border-[0.5px] border-border rounded-[var(--radius-lg)] shadow-xl z-50 py-2 animate-in fade-in slide-in-from-top-2">
                      <button 
                        onClick={() => {
                          setShowQuickActions(false);
                          if (location.pathname !== '/tasks') {
                            navigate('/tasks?action=new-task');
                          } else {
                            window.dispatchEvent(new CustomEvent('open-new-task'));
                          }
                        }}
                        className="w-full text-left px-4 py-2 text-sm font-semibold text-text-body hover:bg-bg-surface flex items-center gap-2"
                      >
                        <ListTodo className="w-4 h-4 text-primary" /> New Task
                      </button>
                      <button 
                        onClick={() => {
                          setShowQuickActions(false);
                          if (location.pathname !== '/dashboard') {
                            navigate('/dashboard?action=invite');
                          } else {
                            window.dispatchEvent(new CustomEvent('open-invite'));
                          }
                        }}
                        className="w-full text-left px-4 py-2 text-sm font-semibold text-text-body hover:bg-bg-surface flex items-center gap-2"
                      >
                        <UserPlus className="w-4 h-4 text-success" /> Invite Member
                      </button>
                    </div>
                  )}
                </div>
                
                {/* Notifications Dropdown */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className={`relative w-8 h-8 flex items-center justify-center rounded-[var(--radius-sm)] hover:scale-105 transition-all duration-200 shrink-0 ${showNotifications ? 'bg-bg-surface text-text-heading' : 'text-text-muted hover:text-text-heading hover:bg-bg-surface'}`}
                    title="Notifications"
                  >
                    <Bell className="w-4 h-4" />
                    {unreadNotifs > 0 && (
                      <span className="absolute top-1 right-1.5 w-[8px] h-[8px] bg-danger rounded-full"></span>
                    )}
                  </button>

                  {/* Notification Panel */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-bg-card border-[0.5px] border-border rounded-[var(--radius-lg)] shadow-xl overflow-hidden z-50 transform origin-top-right transition-all animate-in fade-in slide-in-from-top-4">
                      <div className="px-5 py-4 border-b-[0.5px] border-border flex items-center justify-between bg-bg-surface">
                        <h3 className="font-bold text-text-heading text-[15px] tracking-wide">Notifications</h3>
                        <button 
                          onClick={() => setNotifications(notifications.map(n => ({ ...n, unread: false })))}
                          className="text-[11px] font-semibold text-primary hover:text-primary-dark transition-colors"
                        >
                          Mark all as read
                        </button>
                      </div>
                      
                      <div className="max-h-[360px] overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center flex flex-col items-center">
                            <CheckCircle2 className="w-8 h-8 text-text-hint mb-3" />
                            <p className="text-sm font-medium text-text-muted">You're all caught up!</p>
                          </div>
                        ) : (
                          <div className="divide-y-[0.5px] divide-border">
                            {notifications.map((notif) => (
                              <div 
                                key={notif.id} 
                                className={`p-4 hover:bg-bg-surface transition-colors cursor-pointer flex gap-4 ${notif.unread ? 'bg-primary-light' : ''}`}
                              >
                                {notif.unread && (
                                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary"></div>
                                )}
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${notif.bg} ${notif.color}`}>
                                  <notif.icon className="w-4.5 h-4.5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-bold text-text-heading flex items-center justify-between mb-0.5">
                                    {notif.title}
                                    <span className="text-[10px] font-medium text-text-hint shrink-0 ml-2">{notif.time}</span>
                                  </p>
                                  <p className="text-[13px] text-text-muted leading-snug pr-2">
                                    {notif.desc}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={toggle}
                  aria-label="Toggle dark mode"
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--color-bg-surface)',
                    border: '0.5px solid var(--color-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <span
                    className="theme-icon"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'transform 300ms ease',
                      transform: isDark ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}
                  >
                    {isDark ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" 
                        fill="none" stroke="var(--color-text-muted)" 
                        strokeWidth="2" strokeLinecap="round">
                        <circle cx="12" cy="12" r="4"/>
                        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41
                          M17.66 17.66l1.41 1.41M2 12h2M20 12h2
                          M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24"
                        fill="none" stroke="var(--color-text-muted)"
                        strokeWidth="2" strokeLinecap="round">
                        <path d="M21 12.79A9 9 0 1111.21 3 
                          7 7 0 0021 12.79z"/>
                      </svg>
                    )}
                  </span>
                </button>
                
                {/* User Avatar */}
                <Link to="/profile" className="hidden sm:flex items-center justify-center cursor-pointer transition-transform hover:scale-105 shrink-0">
                  <div className="w-[32px] h-[32px] rounded-full bg-primary flex items-center justify-center text-[13px] font-[600] text-white">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                </Link>

                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center w-8 h-8 rounded-[var(--radius-sm)] text-text-muted hover:text-danger hover:bg-danger-bg transition-all duration-200 shrink-0"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>

                {/* Mobile Menu Toggle */}
                <button 
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="lg:hidden w-8 h-8 flex items-center justify-center rounded-[var(--radius-sm)] text-text-muted hover:text-text-heading hover:bg-bg-surface transition-colors shrink-0"
                >
                  {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login">
                <Button variant="ghost" className={isHome ? 'text-surface-300 hover:text-white hover:bg-white/10' : ''}>
                  Login
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="primary">Get Started</Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {user && isMobileMenuOpen && (
        <div className="lg:hidden border-t-[0.5px] border-border bg-bg-navbar absolute left-0 right-0 top-[65px] shadow-xl">
          <div className="px-4 py-4 space-y-3">
            <Link 
              to="/dashboard" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-3 p-3 rounded-[var(--radius-sm)] text-text-body hover:bg-bg-surface transition-colors font-semibold"
            >
              <LayoutDashboard className="w-5 h-5" /> Dashboard
            </Link>
            <Link 
              to="/tasks" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-3 p-3 rounded-[var(--radius-sm)] text-text-body hover:bg-bg-surface transition-colors font-semibold"
            >
              <ListTodo className="w-5 h-5" /> Tasks
            </Link>
            <Link 
              to="/analytics" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-3 p-3 rounded-[var(--radius-sm)] text-text-body hover:bg-bg-surface transition-colors font-semibold"
            >
              <BarChart2 className="w-5 h-5" /> Analytics
            </Link>

            <div className="pt-4 border-t-[0.5px] border-border px-3">
              <p className="text-[10px] font-black text-text-hint uppercase tracking-widest mb-3">Switch Workspace</p>
              <WorkspaceDropdown />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
