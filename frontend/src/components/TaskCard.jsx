import { Calendar, Pencil, Trash2, AlertCircle, Clock } from 'lucide-react';

const STATUS_COLORS = {
  'todo': 'bg-surface-100 text-surface-600 border border-surface-200',
  'in-progress': 'bg-amber-50 border border-amber-200 text-amber-600',
  'in-review': 'bg-blue-50 border border-blue-200 text-blue-600',
  'done': 'bg-emerald-50 border border-emerald-200 text-emerald-600',
};

const PRIORITY_COLORS = {
  low: 'text-surface-500 font-medium',
  medium: 'text-amber-600 font-medium',
  high: 'text-orange-600 font-medium',
  critical: 'text-red-600 font-bold',
};

const PRIORITY_DOTS = {
  low: 'bg-surface-400',
  medium: 'bg-amber-500',
  high: 'bg-orange-500',
  critical: 'bg-red-500',
};

export default function TaskCard({ task, onEdit, onDelete }) {
  const dueDate = task.dueDate ? new Date(task.dueDate) : null;
  const formattedDate = dueDate
    ? dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  const now = new Date();
  const isOverdue = dueDate && dueDate < now && task.status !== 'done';
  const isDueSoon = !isOverdue && dueDate && (dueDate - now) <= (24 * 60 * 60 * 1000) && task.status !== 'done';

  return (
    <div className="group bg-white border border-surface-200 rounded-2xl p-6 shadow-sm hover:border-primary-200 hover:shadow-lg hover:shadow-primary-600/5 transition-all duration-300">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="font-bold text-surface-900 leading-snug line-clamp-2 group-hover:text-primary-600 transition-colors">{task.title}</h3>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={() => onEdit(task)}
            className="p-1.5 rounded-lg text-surface-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
            title="Edit"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(task._id)}
            className="p-1.5 rounded-lg text-surface-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-sm text-surface-500 font-medium mb-5 line-clamp-2 leading-relaxed">{task.description}</p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          {/* Status badge */}
          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-md tracking-wide ${STATUS_COLORS[task.status]}`}>
            {task.status.replace('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
          </span>
          {/* Priority dot */}
          <span className={`flex items-center gap-1 text-xs ${PRIORITY_COLORS[task.priority]}`}>
            <span className={`w-2 h-2 rounded-full ${PRIORITY_DOTS[task.priority]}`} />
            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
          </span>
        </div>

        {/* Due date badges */}
        {formattedDate && (
          <div className="flex items-center">
            {isOverdue ? (
              <span className="flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-md border border-red-200">
                <AlertCircle className="w-3.5 h-3.5" />
                Overdue
              </span>
            ) : isDueSoon ? (
              <span className="flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                <Clock className="w-3.5 h-3.5" />
                Due Soon
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-surface-500 bg-surface-50 px-2.5 py-1 rounded-md border border-surface-200">
                <Calendar className="w-3.5 h-3.5" />
                {formattedDate}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
