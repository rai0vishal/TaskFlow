import { memo } from 'react';
import { Calendar, Pencil, Trash2, Clock, GripVertical, Plus } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import * as taskApi from '../api/tasks';
import { customToast as toast } from './ToastSystem';

const PRIORITY_COLORS = {
  Low: 'border-l-success',
  Medium: 'border-l-warning',
  High: 'border-l-danger',
  Critical: 'border-l-danger',
};

/* ── Priority badge styles (FIX 8a) ── */
const PRIORITY_BADGE = {
  high: {
    background: 'var(--color-danger-bg)',
    color: 'var(--color-danger)',
    border: '0.5px solid var(--color-danger-border)',
  },
  critical: {
    background: 'var(--color-danger-bg)',
    color: 'var(--color-danger)',
    border: '0.5px solid var(--color-danger-border)',
  },
  medium: {
    background: 'var(--color-warning-bg)',
    color: 'var(--color-warning)',
    border: '0.5px solid var(--color-warning-border)',
  },
  low: {
    background: 'var(--color-success-bg)',
    color: 'var(--color-success)',
    border: '0.5px solid var(--color-success-border)',
  },
};

/* ── Avatar colour map by first letter (FIX 8b) ── */
const AVATAR_COLORS = {
  A: { bg: '#1E1B35', text: '#A89EF5' },
  B: { bg: '#1E1B35', text: '#A89EF5' },
  C: { bg: '#1E1B35', text: '#A89EF5' },
  D: { bg: '#1E1B35', text: '#A89EF5' },
  E: { bg: '#1E1B35', text: '#A89EF5' },
  F: { bg: '#0D2B1A', text: '#4ADE80' },
  G: { bg: '#0D2B1A', text: '#4ADE80' },
  H: { bg: '#0D2B1A', text: '#4ADE80' },
  I: { bg: '#0D2B1A', text: '#4ADE80' },
  J: { bg: '#0D2B1A', text: '#4ADE80' },
  K: { bg: '#0A1A2E', text: '#60A5FA' },
  L: { bg: '#0A1A2E', text: '#60A5FA' },
  M: { bg: '#0A1A2E', text: '#60A5FA' },
  N: { bg: '#0A1A2E', text: '#60A5FA' },
  O: { bg: '#0A1A2E', text: '#60A5FA' },
  P: { bg: '#2A1F05', text: '#FBB024' },
  Q: { bg: '#2A1F05', text: '#FBB024' },
  R: { bg: '#2A1F05', text: '#FBB024' },
  S: { bg: '#2A1F05', text: '#FBB024' },
  T: { bg: '#2A1F05', text: '#FBB024' },
  U: { bg: '#2A0A1A', text: '#F472B6' },
  V: { bg: '#2A0A1A', text: '#F472B6' },
  W: { bg: '#2A0A1A', text: '#F472B6' },
  X: { bg: '#2A0A1A', text: '#F472B6' },
  Y: { bg: '#2A0A1A', text: '#F472B6' },
  Z: { bg: '#2A0A1A', text: '#F472B6' },
};

function getInitials(name) {
  if (!name) return '?';
  return name
    .trim()
    .split(/\s+/)
    .map(w => w[0]?.toUpperCase())
    .filter(Boolean)
    .slice(0, 2)
    .join('');
}

function getAvatarColor(name) {
  const letter = (name || '?').trim().charAt(0).toUpperCase();
  return AVATAR_COLORS[letter] || { bg: '#1E1B35', text: '#A89EF5' };
}

const TaskCard = memo(({ task, onEdit, onDelete, onClick, onViewActivity, canDelete, workspaceMembers = [] }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task._id, data: { status: task.status } });

  // 7b. Dropped: spring back
  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1)',
    zIndex: isDragging ? 999 : 1,
  };

  const dueDate = task.dueDate ? new Date(task.dueDate) : null;
  const formattedDate = dueDate
    ? dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null;

  const now = new Date();
  now.setHours(0,0,0,0);
  let dueColor = 'text-text-muted';
  if (dueDate) {
    const dueDay = new Date(dueDate);
    dueDay.setHours(0,0,0,0);
    const diffDays = (dueDay - now) / (1000*60*60*24);
    if (diffDays < 0 && task.status !== 'done') dueColor = 'text-danger';
    else if (diffDays === 0 && task.status !== 'done') dueColor = 'text-warning';
  }

  const currentPriorityLabel = task.priorityLabel ||
    (task.priority ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1) : 'Medium');
  
  const borderColor = PRIORITY_COLORS[currentPriorityLabel] || PRIORITY_COLORS.Medium;

  // Priority key for badge lookup
  const priorityKey = (task.priority || 'medium').toLowerCase();
  const badgeStyle = PRIORITY_BADGE[priorityKey] || PRIORITY_BADGE.medium;

  // Assignee info
  const assigneeName = task.assignedTo?.name;
  const assigneeInitials = getInitials(assigneeName);
  const avatarColor = getAvatarColor(assigneeName);

  const handleAssign = async (e) => {
    e.stopPropagation();
    const userId = e.target.value;
    if (!userId) return;
    try {
      await taskApi.assignTask({ taskId: task._id, assignedTo: userId });
    } catch(err) {
      //
    }
  };

  // 7b. Dragging: rotate(2deg) scale(1.03), border: 1.5px solid var(--color-primary).
  const draggingClasses = isDragging 
    ? 'rotate-[2deg] scale-[1.03] border-[1.5px] border-primary shadow-2xl opacity-80' 
    : 'border-[0.5px] border-border hover:-translate-y-0.5 hover:shadow-lg';

  // 7a. Description preview: first 60 chars
  const descriptionPreview = task.description && task.description.length > 60
    ? task.description.substring(0, 60) + '...'
    : task.description;

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => onClick && onClick(task)}
      className={`group relative bg-bg-card rounded-[var(--radius-md)] rounded-l-none border-l-[3px] ${borderColor} cursor-pointer transition-all duration-200 flex flex-col p-4 gap-3 ${draggingClasses}`}
    >
      <div className="flex items-start justify-between gap-2">
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="text-text-hint hover:text-text-muted cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <GripVertical className="w-4 h-4" />
        </button>

        <h3 className="flex-1 text-[14px] font-[600] text-text-heading leading-tight pt-0.5">
          {task.title}
        </h3>

        {/* Action icons */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button onClick={(e) => { e.stopPropagation(); onViewActivity(task); }} className="p-1 text-text-hint hover:text-primary transition-colors">
            <Clock className="w-4 h-4" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onEdit(task); }} className="p-1 text-text-hint hover:text-primary transition-colors">
            <Pencil className="w-4 h-4" />
          </button>
          {canDelete(task) && (
            <button onClick={(e) => { e.stopPropagation(); onDelete(task._id); }} className="p-1 text-text-hint hover:text-danger transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {descriptionPreview && (
        <p className="text-[12px] text-text-muted pl-6 break-words">
          {descriptionPreview}
        </p>
      )}

      <div className="flex items-center justify-between pl-6 pt-1">
        {/* Left side: due date + priority badge */}
        <div className="flex items-center gap-2">
          {formattedDate && (
            <div className={`flex items-center gap-1.5 text-[12px] font-[500] ${dueColor}`}>
              <Calendar className="w-3.5 h-3.5" />
              <span>{formattedDate}</span>
            </div>
          )}
          {/* FIX 8a — Priority badge (always visible) */}
          <span
            style={{
              ...badgeStyle,
              fontSize: '11px',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: 'var(--radius-pill)',
              lineHeight: '16px',
              whiteSpace: 'nowrap',
            }}
          >
            {currentPriorityLabel}
          </span>
        </div>

        {/* FIX 8b — Assignee Avatar */}
        <div className="relative group/assign" onPointerDown={(e) => e.stopPropagation()}>
          {assigneeName ? (
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: avatarColor.bg,
                color: avatarColor.text,
                fontSize: '11px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
              title={assigneeName}
            >
              {assigneeInitials}
            </div>
          ) : (
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                border: '1.5px dashed var(--color-border)',
                color: 'var(--color-text-hint)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Plus style={{ width: '12px', height: '12px' }} />
            </div>
          )}
          {workspaceMembers.length > 0 && (
            <select
              className="absolute inset-0 opacity-0 cursor-pointer text-xs"
              value={task.assignedTo?._id || ''}
              onChange={handleAssign}
            >
              <option value="" disabled>Assign user</option>
              {workspaceMembers.map(m => (
                <option key={m.user._id} value={m.user._id}>{m.user.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>
    </div>
  );
});

export default TaskCard;
