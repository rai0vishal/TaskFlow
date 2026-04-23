import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';

const STATUS_OPTIONS = ['todo', 'in-progress', 'in-review', 'done'];
const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'critical'];

export default function TaskModal({ isOpen, onClose, onSubmit, task = null }) {
  const isEditing = !!task;
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'todo',
    priority: task?.priority || 'medium',
    assignedTo: String(task?.assignedTo?._id || task?.assignedTo || ''),
    dueDate: task?.dueDate ? task.dueDate.slice(0, 10) : '',
  });
  
  const { activeWorkspace } = useWorkspace();

  // Reset form when modal opens or selected task changes
  useEffect(() => {
    if (isOpen) {
      setForm({
        title: task?.title || '',
        description: task?.description || '',
        status: task?.status || 'todo',
        priority: task?.priority || 'medium',
        assignedTo: String(task?.assignedTo?._id || task?.assignedTo || ''),
        dueDate: task?.dueDate ? task.dueDate.slice(0, 10) : '',
      });
    }
  }, [isOpen, task]);
  const [loading, setLoading] = useState(false);
  // Modal / Side Panel state logic removed here - moved to dedicated component

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

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--color-bg-surface)',
    color: 'var(--color-text-body)',
    border: '0.5px solid var(--color-border)',
    fontSize: '14px',
    fontWeight: 500,
    outline: 'none',
    transition: 'border-color 200ms ease, box-shadow 200ms ease',
  };
  const inputFocusProps = {
    onFocus: (e) => {
      e.target.style.borderColor = 'var(--color-primary)';
      e.target.style.boxShadow = '0 0 0 3px rgba(108,99,255,0.12)';
    },
    onBlur: (e) => {
      e.target.style.borderColor = 'var(--color-border)';
      e.target.style.boxShadow = 'none';
    },
  };
  const labelStyle = { display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-heading)', marginBottom: '6px', marginLeft: '2px' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col border border-surface-200 dark:border-surface-800 rounded-[1.5rem] shadow-2xl shadow-surface-500/20 dark:shadow-black/40 animate-in fade-in zoom-in duration-200 overflow-hidden" style={{ background: 'var(--color-bg-card)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5" style={{ borderBottom: '0.5px solid var(--color-border)', background: 'var(--color-bg-surface)' }}>
          <h2 className="text-xl font-extrabold tracking-tight" style={{ color: 'var(--color-text-heading)' }}>
            {isEditing ? 'Edit Task' : 'Create New Task'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-surface-400 hover:text-surface-900 dark:hover:text-white hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Container with Scroll */}
        <div className="flex-1 overflow-y-auto min-h-0" style={{ background: 'var(--color-bg-card)' }}>
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div>
            <label htmlFor="title" style={labelStyle}>Title *</label>
            <input
              id="title"
              name="title"
              value={form.title}
              onChange={handleChange}
              style={inputStyle}
              {...inputFocusProps}
              placeholder="What needs to be done?"
              required
              minLength={3}
            />
          </div>

          <div>
            <label htmlFor="description" style={labelStyle}>Description</label>
            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              style={{ ...inputStyle, resize: 'none', height: '96px' }}
              {...inputFocusProps}
              placeholder="Add details..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="status" style={labelStyle}>Status</label>
              <select id="status" name="status" value={form.status} onChange={handleChange} style={inputStyle}>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s.replace('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="priority" style={labelStyle}>Priority</label>
              <select id="priority" name="priority" value={form.priority} onChange={handleChange} style={inputStyle}>
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="dueDate" style={labelStyle}>Due Date</label>
              <input
                id="dueDate"
                type="date"
                name="dueDate"
                value={form.dueDate}
                onChange={handleChange}
                style={inputStyle}
                {...inputFocusProps}
              />
            </div>
            
            <div>
              <label htmlFor="assignedTo" style={labelStyle}>Assigned To</label>
              <select id="assignedTo" name="assignedTo" value={form.assignedTo} onChange={handleChange} style={inputStyle}>
                <option value="">Unassigned</option>
                {activeWorkspace?.members?.map((m) => {
                  const userId = String(m.user?._id || m.user || '');
                  const userName = m.user?.name || 'Member';
                  if (!userId) return null;
                  return (
                    <option key={userId} value={userId}>
                      {userName}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-6 mt-4" style={{ borderTop: '0.5px solid var(--color-border)' }}>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-sm font-bold transition-colors"
                style={{ color: 'var(--color-text-muted)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--color-text-body)';
                  e.currentTarget.style.backgroundColor = 'var(--color-bg-surface)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--color-text-muted)';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl text-sm font-bold shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 active:scale-95"
                style={{ 
                  background: 'var(--color-primary)', 
                  color: 'white',
                  boxShadow: '0 4px 14px 0 rgba(108,99,255,0.39)'
                }}
                onMouseEnter={(e) => {
                  if(!loading) e.currentTarget.style.filter = 'brightness(1.1)';
                }}
                onMouseLeave={(e) => {
                  if(!loading) e.currentTarget.style.filter = 'brightness(1)';
                }}
              >
                {loading ? 'Saving...' : isEditing ? 'Update Task' : 'Create Task'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
