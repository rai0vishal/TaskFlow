import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getTasks } from '../api/tasks';
import { CheckCircle2, Clock, AlertCircle, ListTodo, TrendingUp } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, todo: 0, inProgress: 0, done: 0 });
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data } = await getTasks({ limit: 5 });
      const tasks = data.data.tasks;
      const total = data.data.pagination.total;
      setRecentTasks(tasks);
      setStats({
        total,
        todo: tasks.filter((t) => t.status === 'todo').length,
        inProgress: tasks.filter((t) => t.status === 'in-progress').length,
        done: tasks.filter((t) => t.status === 'done').length,
      });
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: 'Total Tasks', value: stats.total, icon: ListTodo, color: 'from-primary-600 to-primary-400', shadow: 'shadow-primary-500/20' },
    { label: 'To Do', value: stats.todo, icon: Clock, color: 'from-amber-600 to-amber-400', shadow: 'shadow-amber-500/20' },
    { label: 'In Progress', value: stats.inProgress, icon: TrendingUp, color: 'from-blue-600 to-blue-400', shadow: 'shadow-blue-500/20' },
    { label: 'Completed', value: stats.done, icon: CheckCircle2, color: 'from-emerald-600 to-emerald-400', shadow: 'shadow-emerald-500/20' },
  ];

  const STATUS_COLORS = {
    'todo': 'bg-surface-100 text-surface-600 border border-surface-200',
    'in-progress': 'bg-amber-50 border border-amber-200 text-amber-600',
    'in-review': 'bg-blue-50 border border-blue-200 text-blue-600',
    'done': 'bg-emerald-50 border border-emerald-200 text-emerald-600',
  };

  return (
    <div className="font-sans">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-surface-900 tracking-tight">
            Welcome back, <span className="text-primary-600">{user?.name}</span>
          </h1>
          <p className="mt-1 text-surface-500 font-medium">Here&apos;s an overview of your tasks for today</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((stat) => (
            <div
              key={stat.label}
              className="bg-white border border-surface-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold text-surface-500 tracking-wider uppercase">{stat.label}</span>
                <div className={`w-12 h-12 rounded-[1rem] bg-gradient-to-br ${stat.color} ${stat.shadow} shadow-md flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-4xl font-extrabold text-surface-900 tracking-tight">
                {loading ? '...' : stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Recent Tasks */}
        <div className="bg-white border border-surface-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-surface-100 bg-surface-50/50">
            <h2 className="text-lg font-bold text-surface-900">Recent Tasks</h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-surface-500 font-medium animate-pulse">Loading...</div>
          ) : recentTasks.length === 0 ? (
            <div className="p-10 text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-surface-100 flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8 text-surface-400" />
              </div>
              <p className="text-surface-600 font-medium text-lg">No tasks found</p>
              <p className="text-surface-500 text-sm mt-1">Create your first task to get started.</p>
            </div>
          ) : (
            <div className="divide-y divide-surface-100">
              {recentTasks.map((task) => (
                <div key={task._id} className="px-6 py-4 flex items-center justify-between hover:bg-surface-50 transition-colors group">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-surface-900 truncate group-hover:text-primary-600 transition-colors">{task.title}</p>
                    <p className="text-sm text-surface-500 truncate mt-1">{task.description || 'No description provided'}</p>
                  </div>
                  <span className={`ml-4 text-xs font-bold px-3 py-1.5 rounded-md whitespace-nowrap ${STATUS_COLORS[task.status]}`}>
                    {task.status.replace('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
