import { useState, useEffect } from 'react';
import { X, Clock, Activity, Edit3, Trash2, PlusCircle, User, ArrowRight } from 'lucide-react';
import { getTaskActivity } from '../api/tasks';
import { formatRelativeTime, formatFullDateTime } from '../utils/dateUtils';
import { getStructuredChanges } from '../utils/activityUtils';

const getValueStyles = (field, value) => {
  if (!value || value === 'empty') return 'bg-surface-100 text-surface-400 border-surface-200 dark:bg-surface-800 dark:text-surface-600 dark:border-surface-700';
  
  const v = String(value).toLowerCase();
  
  if (field === 'status') {
    switch (v) {
      case 'todo': return 'bg-surface-100 text-surface-600 border-surface-200 dark:bg-surface-800 dark:text-surface-400 dark:border-surface-700';
      case 'in-progress': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/50';
      case 'in-review': return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800/50';
      case 'done': return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50';
    }
  }
  
  if (field === 'priority' || field === 'priorityLabel') {
    switch (v) {
      case 'critical': return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/50';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800/50';
      case 'medium': return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50';
      case 'low': return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50';
    }
  }
  
  return 'bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800/30';
};

const formatChangeValue = (field, value) => {
  if (value === null || value === undefined || value === '') return 'empty';
  
  // If it's a date string (ISO format)
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
    return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }
  
  return String(value);
};

export default function TaskActivityPanel({ task, isOpen, onClose }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && task?._id) {
      const fetchHistory = async () => {
        setLoading(true);
        try {
          const { data } = await getTaskActivity(task._id);
          setActivities(data?.data?.activities || []);
        } catch (error) {
          console.error('Failed to fetch task activity', error);
        } finally {
          setLoading(false);
        }
      };
      fetchHistory();
    }
  }, [isOpen, task]);

  if (!isOpen) return null;

  return (
    <div className="w-[480px] sm:w-[520px] flex flex-col border-l border-surface-200 dark:border-surface-800 shadow-2xl z-[100] fixed right-0 top-0 h-full animate-in slide-in-from-right duration-300" style={{ background: 'var(--color-bg-card)' }}>
      {/* Header */}
      <div className="px-8 py-7 bg-surface-50 dark:bg-surface-900/50 border-b border-surface-200 dark:border-surface-800/50 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-primary-600 dark:text-primary-400 shadow-sm ring-1 ring-primary-500/10">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-black text-surface-900 dark:text-white leading-tight tracking-tight">Task History</h2>
            <p className="text-xs text-surface-500 dark:text-surface-400 font-bold mt-1 truncate max-w-[240px] uppercase tracking-widest">{task?.title}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2.5 text-surface-400 hover:text-surface-900 dark:hover:text-white hover:bg-surface-200 dark:hover:bg-white/5 rounded-2xl transition-all active:scale-90">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8 scrollbar-thin">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin shadow-lg" />
            <p className="text-[10px] font-black text-surface-400 uppercase tracking-[0.2em] animate-pulse">Synchronizing Activity...</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center pb-20">
            <div className="w-20 h-20 rounded-[2.5rem] bg-surface-100 dark:bg-surface-800/50 flex items-center justify-center mb-6 shadow-inner">
              <Clock className="w-10 h-10 text-surface-300 dark:text-surface-700" />
            </div>
            <h3 className="text-lg font-black text-surface-900 dark:text-white">Activity Timeline Empty</h3>
            <p className="text-sm text-surface-500 mt-2 px-12 leading-relaxed">Changes made to this task will automatically appear here as a live audit trail.</p>
          </div>
        ) : (
          <div className="space-y-0">
            {activities.map((act, idx) => {
              const changes = getStructuredChanges(act);
              const isLast = idx === activities.length - 1;
              
              return (
                <div key={act._id} className="flex gap-6 group">
                  {/* Left Column: Line & Icon */}
                  <div className="flex flex-col items-center shrink-0">
                    <div className="w-11 h-11 rounded-[1.25rem] border-2 border-surface-100 dark:border-surface-800 shadow-sm flex items-center justify-center z-10 transition-all duration-300 group-hover:scale-110 group-hover:border-primary-500/50 group-hover:shadow-lg group-hover:shadow-primary-500/10" style={{ background: 'var(--color-bg-card)' }}>
                      {act.action === 'created' && <PlusCircle className="w-5 h-5 text-emerald-500" />}
                      {act.action === 'updated' && <Edit3 className="w-5 h-5 text-amber-500" />}
                      {act.action === 'deleted' && <Trash2 className="w-5 h-5 text-red-500" />}
                    </div>
                    {!isLast && (
                      <div className="w-[2px] flex-1 bg-gradient-to-b from-surface-100 to-surface-100 dark:from-surface-800 dark:to-surface-800 my-2" />
                    )}
                  </div>

                  {/* Right Column: Content */}
                  <div className={`flex-1 pb-10 ${!isLast ? 'min-h-[120px]' : ''}`}>
                    <div className="flex flex-col gap-1 mb-4">
                      <span className="text-sm font-black text-surface-900 dark:text-white">{act.performedBy?.name || 'Someone'}</span>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-surface-400" />
                        <span className="text-[10px] text-surface-400 font-black uppercase tracking-widest tabular-nums" title={formatFullDateTime(act.createdAt)}>
                          {formatRelativeTime(act.createdAt)}
                        </span>
                      </div>
                    </div>

                    <div className="p-5 rounded-[1.5rem] bg-surface-50 dark:bg-surface-900/40 border border-surface-100 dark:border-surface-800/50 shadow-sm group-hover:border-surface-200 dark:group-hover:border-surface-700 transition-colors">
                      {act.action === 'created' ? (
                        <p className="text-sm text-surface-600 dark:text-surface-300 font-bold italic opacity-80">Initial creation of this task</p>
                      ) : act.action === 'updated' && changes.length > 0 ? (
                        <div className="space-y-5">
                          {changes.map((change, cIdx) => (
                            <div key={cIdx} className="space-y-2.5">
                              <p className="text-[9px] font-black text-surface-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary-500/30" />
                                Changed {change.field}
                              </p>
                              <div className="flex items-center gap-3 flex-wrap">
                                <span className={`px-3 py-1.5 rounded-xl text-[11px] font-black border tracking-tight ${getValueStyles(change.field, change.oldValue)} opacity-60`}>
                                  {formatChangeValue(change.field, change.oldValue)}
                                </span>
                                <ArrowRight className="w-4 h-4 text-surface-300 dark:text-surface-700 shrink-0" />
                                <span className={`px-3 py-1.5 rounded-xl text-[11px] font-black border tracking-tight shadow-sm ${getValueStyles(change.field, change.newValue)}`}>
                                  {formatChangeValue(change.field, change.newValue)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-surface-600 dark:text-surface-300 font-bold">
                          {act.action === 'updated' ? 'Updated task properties' : 'Deleted this task'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
