import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LayoutDashboard, ListTodo, LogOut, FolderKanban, MessageSquare, Sun, Moon, Bell, Clock, AlertCircle, UserPlus, CheckCircle2, Menu, X } from 'lucide-react';
import Button from './Button';
import { getTasks } from '../api/tasks';

export default function Navbar({ onChatToggle, unreadCount }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const notifRef = useRef(null);

  // Close notifications if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch real notifications based on tasks
  useEffect(() => {
    if (!user) return;
    
    const fetchNotifications = async () => {
      try {
        const { data } = await getTasks();
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
              color: 'text-red-500',
              bg: 'bg-red-500/10'
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
              color: 'text-amber-500',
              bg: 'bg-amber-500/10'
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
  }, [user]);

  const unreadNotifs = notifications.filter(n => n.unread).length;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const linkClass = (path) =>
    `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
      location.pathname === path
        ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
        : 'text-surface-500 hover:text-surface-900 hover:bg-surface-100 dark:text-surface-400 dark:hover:text-white dark:hover:bg-surface-800'
    }`;

  const isHome = location.pathname === '/' && !user;

  return (
    <nav className={`sticky top-0 z-50 transition-colors duration-300 ${
      isHome
        ? 'bg-surface-950/60 backdrop-blur-xl border-b border-white/[0.06]'
        : 'bg-white/80 dark:bg-surface-900/80 backdrop-blur-xl border-b border-surface-200 dark:border-surface-800'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex items-center justify-between h-16">
          {/* Logo */}
          <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/30 group-hover:shadow-primary-500/50 transition-shadow">
              <FolderKanban className="w-5 h-5 text-white" />
            </div>
            <span className={`text-xl font-extrabold bg-clip-text text-transparent tracking-tight ${
              isHome
                ? 'bg-gradient-to-r from-white to-surface-300'
                : 'bg-gradient-to-r from-surface-900 to-surface-700 dark:from-white dark:to-surface-300'
            }`}>
              TaskFlow
            </span>
          </Link>

          {/* Navigation - Only show if logged in */}
          {user ? (
            <>
              {/* Center Nav Links */}
              <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 hidden lg:flex">
                <Link to="/dashboard" className={linkClass('/dashboard')}>
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="inline">Dashboard</span>
                </Link>
                <Link to="/tasks" className={linkClass('/tasks')}>
                  <ListTodo className="w-4 h-4" />
                  <span className="inline">Tasks</span>
                </Link>
              </div>

              {/* Right Menu (User, Settings, Actions) */}
              <div className="flex items-center gap-3 sm:gap-4 ml-auto">
                <Link to="/profile" className="hidden sm:flex items-center gap-2 hover:bg-surface-100 dark:hover:bg-surface-800 p-1.5 rounded-xl transition-colors cursor-pointer pr-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-sm font-bold text-white shadow-md shadow-primary-500/20">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-sm">
                    <p className="font-semibold text-surface-900 dark:text-white transition-colors">{user?.name}</p>
                    <p className="text-xs font-medium text-surface-500 dark:text-surface-400 capitalize">{user?.role}</p>
                  </div>
                </Link>
                
                {/* Theme Toggle */}
                <button
                  onClick={toggleTheme}
                  className="p-2 text-surface-500 dark:text-surface-400 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg hover:scale-110 transition-all duration-200"
                  title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                  {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
                
                {/* Notifications Dropdown */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className={`relative p-2 rounded-lg hover:scale-110 transition-all duration-200 ${showNotifications ? 'bg-surface-200 dark:bg-surface-800 text-surface-900 dark:text-white' : 'text-surface-500 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white hover:bg-surface-100 dark:hover:bg-surface-800'}`}
                    title="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadNotifs > 0 && (
                      <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-red-500 text-[9px] font-bold text-white rounded-full border-2 border-white dark:border-surface-900 shadow-sm">
                        {unreadNotifs > 9 ? '9+' : unreadNotifs}
                      </span>
                    )}
                  </button>

                  {/* Notification Panel */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white/95 dark:bg-[#0f0f11]/95 backdrop-blur-2xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_50px_rgba(0,0,0,0.5)] border border-surface-200/50 dark:border-white/10 rounded-2xl overflow-hidden z-50 transform origin-top-right transition-all animate-in fade-in slide-in-from-top-4">
                      <div className="px-5 py-4 border-b border-surface-200/50 dark:border-white/5 flex items-center justify-between bg-surface-50 dark:bg-surface-900/50">
                        <h3 className="font-bold text-surface-900 dark:text-white text-[15px] tracking-wide">Notifications</h3>
                        <button 
                          onClick={() => setNotifications(notifications.map(n => ({ ...n, unread: false })))}
                          className="text-[11px] font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                        >
                          Mark all as read
                        </button>
                      </div>
                      
                      <div className="max-h-[360px] overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center flex flex-col items-center">
                            <CheckCircle2 className="w-8 h-8 text-surface-300 dark:text-surface-600 mb-3" />
                            <p className="text-sm font-medium text-surface-500 dark:text-surface-400">You're all caught up!</p>
                          </div>
                        ) : (
                          <div className="divide-y divide-surface-100 dark:divide-white/5">
                            {notifications.map((notif) => (
                              <div 
                                key={notif.id} 
                                className={`p-4 hover:bg-surface-50 dark:hover:bg-white/5 transition-colors cursor-pointer flex gap-4 ${notif.unread ? 'bg-primary-50/30 dark:bg-primary-900/10' : ''}`}
                              >
                                {/* Unread Indicator Border (Left edge) */}
                                {notif.unread && (
                                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary-500"></div>
                                )}
                                
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${notif.bg} ${notif.color}`}>
                                  <notif.icon className="w-4.5 h-4.5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-bold text-surface-900 dark:text-gray-100 flex items-center justify-between mb-0.5">
                                    {notif.title}
                                    <span className="text-[10px] font-medium text-surface-400 dark:text-surface-500 shrink-0 ml-2">{notif.time}</span>
                                  </p>
                                  <p className="text-[13px] text-surface-500 dark:text-surface-400 leading-snug pr-2">
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
                  onClick={onChatToggle}
                  className="relative p-2 text-surface-500 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg hover:scale-110 transition-all duration-200"
                  title="Messages"
                >
                  <MessageSquare className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-surface-900 animate-pulse"></span>
                  )}
                </button>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-surface-500 dark:text-surface-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition-all duration-200"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>

                {/* Mobile Menu Toggle */}
                <button 
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="lg:hidden p-2 text-surface-500 hover:text-surface-900 dark:text-surface-400 dark:hover:text-white transition-colors"
                >
                  {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login">
                <Button variant="ghost" size="sm" className={isHome ? 'text-surface-300 hover:text-white hover:bg-white/10' : ''}>
                  Login
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="primary" size="sm">Get Started</Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {user && isMobileMenuOpen && (
        <div className="lg:hidden border-t border-surface-200 dark:border-surface-800 bg-white/95 dark:bg-surface-900/95 backdrop-blur-xl absolute left-0 right-0 top-[65px] shadow-xl shadow-surface-200/20 dark:shadow-black/40">
          <div className="px-4 py-4 space-y-3">
            <Link 
              to="/dashboard" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-3 p-3 rounded-xl text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors font-semibold"
            >
              <LayoutDashboard className="w-5 h-5" /> Dashboard
            </Link>
            <Link 
              to="/tasks" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-3 p-3 rounded-xl text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors font-semibold"
            >
              <ListTodo className="w-5 h-5" /> Tasks
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
