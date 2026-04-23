import { useState, useRef, useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import TaskCard from './TaskCard';
import { Inbox, Plus } from 'lucide-react';
import * as taskApi from '../api/tasks';
import { useWorkspace } from '../context/WorkspaceContext';

const TITLES = {
  'todo': 'To Do',
  'in-progress': 'In Progress',
  'in-review': 'In Review',
  'done': 'Done',
};

const COLUMN_COLORS = {
  'todo': 'bg-text-muted',
  'in-progress': 'bg-warning',
  'in-review': 'bg-info',
  'done': 'bg-success',
};

export default function KanbanColumn({ id, tasks, onEdit, onDelete, onClick, onViewActivity, canDelete, workspaceMembers }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const dotColor = COLUMN_COLORS[id] || 'bg-text-muted';
  const { activeWorkspace } = useWorkspace();
  
  const [isQuickAdding, setIsQuickAdding] = useState(false);
  const [quickAddTitle, setQuickAddTitle] = useState('');
  const inputRef = useRef(null);

  const [prevCount, setPrevCount] = useState(tasks.length);
  const [badgePulse, setBadgePulse] = useState(false);

  useEffect(() => {
    if (tasks.length !== prevCount) {
      setBadgePulse(true);
      const timer = setTimeout(() => setBadgePulse(false), 200);
      setPrevCount(tasks.length);
      return () => clearTimeout(timer);
    }
  }, [tasks.length, prevCount]);

  useEffect(() => {
    if (isQuickAdding && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isQuickAdding]);

  const handleQuickAdd = async () => {
    if (!quickAddTitle.trim() || !activeWorkspace?._id) {
      setIsQuickAdding(false);
      setQuickAddTitle('');
      return;
    }
    const payload = {
      title: quickAddTitle.trim(),
      status: id,
      workspace: activeWorkspace._id,
      priority: 'medium'
    };
    try {
      await taskApi.createTask(payload);
    } catch (err) {
      // Handle error
    }
    setQuickAddTitle('');
    setIsQuickAdding(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleQuickAdd();
    if (e.key === 'Escape') {
      setIsQuickAdding(false);
      setQuickAddTitle('');
    }
  };

  return (
    <div className="flex flex-col h-full min-h-[400px]">
      {/* 7c. Column Header */}
      <div className="px-1 py-3 flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-[10px] h-[10px] rounded-full ${dotColor}`} />
          <h3 className="font-[600] text-text-heading text-[14px]">
            {TITLES[id]}
          </h3>
        </div>
        <span 
          className={`bg-bg-surface border-[0.5px] border-border text-text-muted text-[12px] font-[500] px-[8px] py-[2px] rounded-[var(--radius-pill)] transition-transform duration-200 ${badgePulse ? 'scale-[1.3]' : 'scale-100'}`}
        >
          {tasks.length}
        </span>
      </div>

      {/* Drop Zone */}
      <div
        ref={setNodeRef}
        className={`flex-1 flex flex-col gap-3 rounded-[var(--radius-md)] transition-all duration-200 p-2 -mx-2 min-h-[200px] ${
          isOver ? 'bg-[rgba(108,99,255,0.06)] border-[1.5px] border-dashed border-primary' : 'border-[1.5px] border-transparent border-dashed'
        }`}
      >
        <SortableContext items={tasks.map(t => t._id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard 
              key={task._id} 
              task={task} 
              onEdit={onEdit} 
              onDelete={onDelete} 
              onClick={onClick} 
              onViewActivity={onViewActivity}
              canDelete={canDelete}
              workspaceMembers={workspaceMembers} 
            />
          ))}
        </SortableContext>

        {/* 7d. Empty Column */}
        {tasks.length === 0 && !isQuickAdding && (
          <div className="border-[1.5px] border-dashed border-border rounded-[var(--radius-md)] p-[32px] text-center flex flex-col items-center justify-center">
            <p className="text-[14px] text-text-muted mb-2">No tasks</p>
            <button onClick={() => setIsQuickAdding(true)} className="text-[14px] text-primary hover:underline cursor-pointer">
              + Add task
            </button>
          </div>
        )}

        {/* 7e. Inline Quick Add */}
        {isQuickAdding ? (
          <div className="bg-bg-card border-[0.5px] border-primary rounded-[var(--radius-sm)] shadow-[0_0_0_3px_rgba(108,99,255,0.12)] p-3 animate-in fade-in zoom-in-95 duration-150">
            <input
              ref={inputRef}
              type="text"
              value={quickAddTitle}
              onChange={(e) => setQuickAddTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleQuickAdd}
              placeholder="What needs to be done?"
              className="w-full bg-transparent border-none outline-none text-[14px] text-text-body placeholder:text-text-hint"
            />
          </div>
        ) : (
          tasks.length > 0 && (
            <button 
              onClick={() => setIsQuickAdding(true)}
              className="mt-2 text-left text-[14px] font-[500] text-text-muted hover:text-text-body transition-colors py-2 px-1 flex items-center gap-1 w-full"
            >
              <Plus className="w-4 h-4" /> Add a task
            </button>
          )
        )}
      </div>
    </div>
  );
}
