import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import TaskCard from './TaskCard';
import { Inbox, Plus } from 'lucide-react';

const TITLES = {
  'todo': 'To Do',
  'in-progress': 'In Progress',
  'in-review': 'In Review',
  'done': 'Done',
};

const COLUMN_ACCENTS = {
  'todo': { dot: 'bg-surface-400 dark:bg-surface-500', border: 'border-l-surface-400' },
  'in-progress': { dot: 'bg-amber-500', border: 'border-l-amber-500' },
  'in-review': { dot: 'bg-blue-500', border: 'border-l-blue-500' },
  'done': { dot: 'bg-emerald-500', border: 'border-l-emerald-500' },
};

export default function KanbanColumn({ id, tasks, onEdit, onDelete }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const accent = COLUMN_ACCENTS[id];

  return (
    <div className={`flex flex-col rounded-xl border border-surface-200/60 dark:border-surface-800/50 ${accent.border} border-l-[3px] transition-all duration-200 ${isOver
        ? 'bg-primary-50/40 dark:bg-primary-950/15 ring-1 ring-primary-400/30 dark:ring-primary-500/20 scale-[1.005]'
        : 'bg-surface-100/50 dark:bg-surface-900/30'
      }`}>
      {/* Column Header */}
      <div className="px-3.5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${accent.dot} shrink-0`} />
          <h3 className="font-bold text-surface-800 dark:text-surface-200 text-xs uppercase tracking-[0.08em]">
            {TITLES[id]}
          </h3>
        </div>
        <span className="bg-surface-200/60 dark:bg-surface-700/60 text-surface-500 dark:text-surface-400 text-[10px] font-bold px-2 py-0.5 rounded-full tabular-nums min-w-[20px] text-center">
          {tasks.length}
        </span>
      </div>

      {/* Drop Zone */}
      <div
        ref={setNodeRef}
        className="flex-1 px-2.5 pb-2.5 min-h-[280px] flex flex-col gap-2"
      >
        <SortableContext items={tasks.map(t => t._id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task._id} task={task} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </SortableContext>

        {/* Empty State */}
        {tasks.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center py-8">
            <div className="w-10 h-10 rounded-xl bg-surface-200/50 dark:bg-surface-800/50 flex items-center justify-center mb-2.5">
              <Inbox className="w-5 h-5 text-surface-400 dark:text-surface-600" />
            </div>
            <p className="text-[11px] font-semibold text-surface-400 dark:text-surface-500 text-center">
              No tasks here 🎯
            </p>
            <p className="text-[10px] font-medium text-surface-300 dark:text-surface-600 mt-0.5">
              Drag a card to add
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
