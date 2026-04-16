import { Calendar, Pencil, Trash2, AlertCircle, Clock, GripVertical, User as UserIcon, Hash } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

/* ─── Priority Configuration (glassmorphism soft-glow badges) ─── */
const PRIORITY_CONFIG = {
  Low: {
    badge: 'bg-green-200/50 dark:bg-emerald-900/30 text-green-700 dark:text-emerald-400',
    border: 'border-l-emerald-400/70',
    dot: 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]',
  },
  Medium: {
    badge: 'bg-yellow-200/50 dark:bg-amber-900/30 text-yellow-700 dark:text-amber-400',
    border: 'border-l-amber-400/70',
    dot: 'bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.4)]',
  },
  High: {
    badge: 'bg-red-200/50 dark:bg-red-900/30 text-red-700 dark:text-red-400',
    border: 'border-l-red-400/70',
    dot: 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.4)]',
  },
  Critical: {
    badge: 'bg-red-300/50 dark:bg-red-900/40 text-red-800 dark:text-red-300 ring-1 ring-red-400/30',
    border: 'border-l-red-500/80',
    dot: 'bg-red-600 animate-pulse shadow-[0_0_8px_rgba(220,38,38,0.5)]',
  },
};

export default function TaskCard({ task, onEdit, onDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task._id, data: { status: task.status } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const dueDate = task.dueDate ? new Date(task.dueDate) : null;
  const formattedDate = dueDate
    ? dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null;

  const now = new Date();
  const isOverdue = dueDate && dueDate < now && task.status !== 'done';
  const isDueSoon = !isOverdue && dueDate && (dueDate - now) <= (24 * 60 * 60 * 1000) && task.status !== 'done';

  const currentPriorityLabel = task.priorityLabel ||
    (task.priority ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1) : 'Medium');
  const priority = PRIORITY_CONFIG[currentPriorityLabel] || PRIORITY_CONFIG.Medium;

  const assigneeName = task.assignedTo?.name;
  const assigneeInitial = assigneeName?.charAt(0).toUpperCase();

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative rounded-xl border-l-[3px] ${priority.border} cursor-pointer transition-all duration-300 ${
        isDragging
          ? 'opacity-40 ring-2 ring-primary-400 scale-[1.03] z-50 shadow-2xl shadow-primary-500/20'
          : 'bg-white/60 dark:bg-surface-900/50 backdrop-blur-lg border border-white/20 dark:border-surface-700/30 shadow-lg shadow-surface-300/20 dark:shadow-surface-950/30 hover:shadow-xl hover:shadow-surface-400/25 dark:hover:shadow-primary-500/10 hover:scale-[1.03] hover:bg-white/70 dark:hover:bg-surface-800/60'
      }`}
    >
      {/* ── Gradient Overlay ── */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/40 to-white/5 dark:from-white/[0.06] dark:to-transparent pointer-events-none" />

      {/* ── Inner Shadow (subtle depth) ── */}
      <div className="absolute inset-0 rounded-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.3),inset_0_-1px_0_rgba(0,0,0,0.03)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),inset_0_-1px_0_rgba(0,0,0,0.15)] pointer-events-none" />

      {/* ── Main Content ── */}
      <div className="relative p-4">

        {/* Top Row: Grip + Title + Actions */}
        <div className="flex items-start gap-2">
          <button
            {...attributes}
            {...listeners}
            className="mt-[2px] p-0.5 text-surface-300/70 dark:text-surface-500 hover:text-primary-500 cursor-grab active:cursor-grabbing rounded opacity-0 group-hover:opacity-100 transition-all duration-200 shrink-0"
          >
            <GripVertical className="w-3.5 h-3.5" />
          </button>

          <h3 className="flex-1 text-sm font-semibold text-surface-800 dark:text-white leading-snug line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-200">
            {task.title}
          </h3>

          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-all duration-200 shrink-0">
            <button
              onClick={() => onEdit(task)}
              className="p-1.5 rounded-lg text-surface-400/80 hover:text-primary-600 hover:bg-primary-100/50 dark:hover:bg-primary-950/30 backdrop-blur-sm transition-all duration-200 hover:scale-110"
              title="Edit"
            >
              <Pencil className="w-3 h-3" />
            </button>
            <button
              onClick={() => onDelete(task._id)}
              className="p-1.5 rounded-lg text-surface-400/80 hover:text-red-600 hover:bg-red-100/50 dark:hover:bg-red-950/30 backdrop-blur-sm transition-all duration-200 hover:scale-110"
              title="Delete"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Description */}
        {task.description && (
          <p className="text-xs text-surface-500/80 dark:text-surface-400 font-medium mt-1.5 line-clamp-2 leading-relaxed pl-6">
            {task.description}
          </p>
        )}

        {/* ── Divider + Footer ── */}
        <div className="border-t border-surface-200/30 dark:border-surface-700/30 mt-3 pt-3 pl-6">
          <div className="flex items-center justify-between gap-2">

            {/* Left: Priority Badge + Task ID */}
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full backdrop-blur-sm ${priority.badge}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${priority.dot}`} />
                {currentPriorityLabel}
              </span>
            </div>

            {/* Right: Due date + Avatar */}
            <div className="flex items-center gap-2">
              {formattedDate && (
                <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-sm ${
                  isOverdue
                    ? 'text-red-700 dark:text-red-400 bg-red-200/40 dark:bg-red-900/30'
                    : isDueSoon
                      ? 'text-amber-700 dark:text-amber-400 bg-amber-200/40 dark:bg-amber-900/30'
                      : 'text-surface-600 dark:text-surface-400 bg-surface-200/30 dark:bg-surface-700/30'
                }`}>
                  {isOverdue ? (
                    <AlertCircle className="w-3 h-3" />
                  ) : isDueSoon ? (
                    <Clock className="w-3 h-3" />
                  ) : (
                    <Calendar className="w-3 h-3" />
                  )}
                  {isOverdue ? 'Overdue' : isDueSoon ? 'Soon' : formattedDate}
                </span>
              )}

              {/* Assignee Avatar */}
              {assigneeName ? (
                <div
                  className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-[10px] font-bold text-white shadow-md shadow-primary-500/30 ring-2 ring-white/50 dark:ring-surface-800/50"
                  title={assigneeName}
                >
                  {assigneeInitial}
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full bg-surface-200/40 dark:bg-surface-700/40 backdrop-blur-sm flex items-center justify-center ring-2 ring-white/50 dark:ring-surface-800/50">
                  <UserIcon className="w-3 h-3 text-surface-400/70 dark:text-surface-500" />
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
