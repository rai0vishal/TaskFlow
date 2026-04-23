import React from 'react';
import { X, Clock, User, Tag, AlertCircle, ChevronRight, Calendar, MessageSquare, Trash2, Edit } from 'lucide-react';
import Button from './Button';

import * as taskApi from '../api/tasks';
import toast from 'react-hot-toast';

export default function TaskDetailPanel({ task, isOpen, onClose, onEdit, onDelete, canDelete, workspaceMembers = [] }) {
  if (!task) return null;

  const handleAssign = async (userId) => {
    try {
      await taskApi.assignTask({ taskId: task._id, assignedTo: userId });
      toast.success('Task assigned');
    } catch (err) {
      toast.error('Failed to assign task');
    }
  };

  const getPriorityStyles = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400';
      case 'medium': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400';
      case 'low': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400';
      default: return 'bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400';
    }
  };

  const getStatusStyles = (status) => {
    switch (status) {
      case 'todo': return 'bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400';
      case 'in-progress': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400';
      case 'in-review': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400';
      case 'done': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400';
      default: return 'bg-surface-100 text-surface-600';
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className={`fixed right-0 top-0 h-full w-full max-w-md shadow-2xl z-50 transition-transform duration-300 transform ${isOpen ? 'translate-x-0' : 'translate-x-full'}`} style={{ background: 'var(--color-bg-card)' }}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-surface-100 dark:border-surface-800">
            <h2 className="text-xl font-bold text-surface-900 dark:text-white">Task Details</h2>
            <button 
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {/* Title & Description */}
            <section>
              <h3 className="text-2xl font-black text-surface-900 dark:text-white mb-3 leading-tight">{task.title}</h3>
              <p className="text-surface-600 dark:text-surface-400 leading-relaxed whitespace-pre-wrap">
                {task.description || "No description provided."}
              </p>
            </section>

            {/* Meta Grid */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-[10px] font-bold text-surface-400 uppercase tracking-widest mb-2">Status</p>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold capitalize ${getStatusStyles(task.status)}`}>
                  {task.status.replace('-', ' ')}
                </span>
              </div>
              <div>
                <p className="text-[10px] font-bold text-surface-400 uppercase tracking-widest mb-2">Priority</p>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold capitalize ${getPriorityStyles(task.priorityLabel)}`}>
                  {task.priorityLabel || 'Medium'}
                </span>
              </div>
            </div>

            {/* Assignment & Date */}
            <div className="space-y-6 pt-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center">
                    <User className="w-5 h-5 text-surface-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">Assignee</p>
                    <p className="font-bold text-surface-900 dark:text-white">
                      {typeof task.assignedTo === 'object' ? task.assignedTo?.name : (workspaceMembers.find(m => m.user._id === task.assignedTo)?.user.name || "Unassigned")}
                    </p>
                  </div>
                </div>
                
                {/* Assignment Dropdown */}
                <div className="relative group/assign">
                  <select
                    className="absolute inset-0 opacity-0 cursor-pointer w-full"
                    onChange={(e) => handleAssign(e.target.value)}
                    value={typeof task.assignedTo === 'object' ? task.assignedTo?._id : (task.assignedTo || '')}
                  >
                    <option value="" disabled>Assign to...</option>
                    {workspaceMembers.map(m => (
                      <option key={m.user._id} value={m.user._id}>{m.user.name}</option>
                    ))}
                  </select>
                  <Button variant="ghost" size="sm" className="text-primary-600 dark:text-primary-400 text-[11px] font-bold">
                    Change
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-surface-400" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">Due Date</p>
                  <p className="font-bold text-surface-900 dark:text-white">
                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : "No due date"}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer / Actions */}
            <div className="pt-8 flex flex-col gap-3">
              <Button 
                onClick={() => { onEdit(task); onClose(); }} 
                variant="outline" 
                className="w-full gap-2 py-3"
              >
                <Edit className="w-4 h-4" /> Edit Task
              </Button>
              {canDelete && (
                <Button 
                  onClick={() => { onDelete(task._id); onClose(); }} 
                  variant="outline" 
                  className="w-full gap-2 py-3 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-900/50"
                >
                  <Trash2 className="w-4 h-4" /> Delete Task
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
