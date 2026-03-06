import { useState, useEffect } from 'react';
import { X, Clock, Activity, Edit3, Trash2, PlusCircle } from 'lucide-react';
import { getTaskActivity } from '../api/tasks';

const STATUS_OPTIONS = ['todo', 'in-progress', 'in-review', 'done'];
const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'critical'];

export default function TaskModal({ isOpen, onClose, onSubmit, task = null }) {
  const isEditing = !!task;
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'todo',
    priority: task?.priority || 'medium',
    dueDate: task?.dueDate ? task.dueDate.slice(0, 10) : '',
  });
  const [loading, setLoading] = useState(false);
  const [activities, setActivities] = useState([]);
  const [loadingActivity, setLoadingActivity] = useState(false);

  useEffect(() => {
    if (isEditing && task._id) {
      const fetchHistory = async () => {
        setLoadingActivity(true);
        try {
          const { data } = await getTaskActivity(task._id);
          setActivities(data?.data?.activities || []);
        } catch (error) {
          console.error('Failed to fetch task activity', error);
        } finally {
          setLoadingActivity(false);
        }
      };
      fetchHistory();
    }
  }, [isEditing, task]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form };
      if (payload.dueDate) {
        payload.dueDate = new Date(payload.dueDate).toISOString();
      } else {
        delete payload.dueDate;
      }
      await onSubmit(payload);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const inputClass =
    'w-full px-4 py-3 rounded-xl bg-surface-50 border border-surface-200 text-surface-900 placeholder-surface-400 focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 transition-all duration-200 font-medium';
  const labelClass = 'block text-sm font-semibold text-surface-700 mb-2 ml-1';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-white border border-surface-200 rounded-[1.5rem] shadow-2xl shadow-surface-500/20 animate-in fade-in zoom-in duration-200 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-surface-100 bg-surface-50/50">
          <h2 className="text-xl font-extrabold text-surface-900 tracking-tight">
            {isEditing ? 'Edit Task' : 'Create New Task'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-surface-400 hover:text-surface-900 hover:bg-surface-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Container with Scroll */}
        <div className="flex-1 overflow-y-auto min-h-0 bg-white">
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div>
            <label htmlFor="title" className={labelClass}>Title *</label>
            <input
              id="title"
              name="title"
              value={form.title}
              onChange={handleChange}
              className={inputClass}
              placeholder="What needs to be done?"
              required
              minLength={3}
            />
          </div>

          <div>
            <label htmlFor="description" className={labelClass}>Description</label>
            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              className={`${inputClass} resize-none h-24`}
              placeholder="Add details..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="status" className={labelClass}>Status</label>
              <select id="status" name="status" value={form.status} onChange={handleChange} className={inputClass}>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s.replace('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="priority" className={labelClass}>Priority</label>
              <select id="priority" name="priority" value={form.priority} onChange={handleChange} className={inputClass}>
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="dueDate" className={labelClass}>Due Date</label>
            <input
              id="dueDate"
              type="date"
              name="dueDate"
              value={form.dueDate}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-6 border-t border-surface-100 mt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-surface-600 hover:text-surface-900 hover:bg-surface-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl text-sm font-bold bg-primary-600 text-white shadow-md shadow-primary-500/20 hover:shadow-lg hover:shadow-primary-500/30 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 active:scale-95"
              >
                {loading ? 'Saving...' : isEditing ? 'Update Task' : 'Create Task'}
              </button>
            </div>
          </form>

          {/* Activity History Section */}
          {isEditing && (
            <div className="px-8 pb-8 pt-6 border-t border-surface-100 bg-surface-50/30">
              <div className="flex items-center gap-2 mb-6">
                <Activity className="w-5 h-5 text-primary-500" />
                <h3 className="text-sm font-extrabold tracking-wide uppercase text-surface-900">Activity History</h3>
              </div>
              
              {loadingActivity ? (
                <div className="flex justify-center py-6">
                  <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : activities.length === 0 ? (
                <p className="text-sm text-surface-500 font-medium italic bg-white p-4 rounded-xl border border-surface-200 text-center">No activity recorded yet.</p>
              ) : (
                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-surface-200 before:to-transparent">
                  {activities.map((act) => (
                    <div key={act._id} className="relative flex items-start gap-4 text-sm group">
                      <div className="mt-1 relative z-10 w-6 h-6 rounded-full bg-white border-2 border-surface-100 shadow-sm flex items-center justify-center shrink-0">
                        {act.action === 'created' && <PlusCircle className="w-3.5 h-3.5 text-emerald-500" />}
                        {act.action === 'updated' && <Edit3 className="w-3.5 h-3.5 text-amber-500" />}
                        {act.action === 'deleted' && <Trash2 className="w-3.5 h-3.5 text-red-500" />}
                      </div>
                      <div className="flex-1 bg-white p-4 rounded-[1rem] border border-surface-200 shadow-sm group-hover:shadow-md transition-shadow">
                        <p className="text-surface-700 font-medium">
                          <span className="font-bold text-surface-900">{act.performedBy?.name || 'Unknown User'}</span>{' '}
                          {act.action === 'created' ? 'created this task' : act.action === 'updated' ? 'updated task fields' : 'deleted this task'}
                        </p>
                        
                        {/* Display changed fields if it's an update */}
                        {act.action === 'updated' && act.details && Object.keys(act.details).length > 0 && (
                          <div className="mt-3 p-3 rounded-lg bg-surface-50 border border-surface-100 text-xs font-medium">
                            {Object.entries(act.details).map(([field, changes]) => (
                              <div key={field} className="grid grid-cols-[80px_1fr] gap-3 mb-2 last:mb-0 items-center">
                                <span className="text-surface-500 capitalize">{field}:</span>
                                <span className="text-surface-700 flex items-center flex-wrap gap-1.5">
                                  <span className="line-through text-surface-400 bg-surface-100 px-1.5 py-0.5 rounded">{String(changes.old || 'empty')}</span>
                                  <span className="text-surface-300">→</span>
                                  <span className="text-emerald-700 font-bold bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded">{String(changes.new || 'empty')}</span>
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        <div className="flex items-center gap-1.5 mt-3 text-xs font-semibold text-surface-400 uppercase tracking-wider">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(act.createdAt).toLocaleString(undefined, { 
                            month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
