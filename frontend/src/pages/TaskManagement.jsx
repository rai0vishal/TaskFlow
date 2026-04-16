import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';
import TaskCard from '../components/TaskCard';
import TaskModal from '../components/TaskModal';
import Button from '../components/Button';
import * as taskApi from '../api/tasks';
import toast from 'react-hot-toast';
import { Plus, Filter, ChevronLeft, ChevronRight, Inbox, LayoutGrid, Sparkles } from 'lucide-react';
import { DndContext, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import KanbanColumn from '../components/KanbanColumn';

const STATUS_FILTERS = [
  { label: 'All', value: '', icon: LayoutGrid },
  { label: 'To Do', value: 'todo' },
  { label: 'In Progress', value: 'in-progress' },
  { label: 'In Review', value: 'in-review' },
  { label: 'Done', value: 'done' },
];

export default function TaskManagement() {
  const [tasks, setTasks] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 1 });
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const fetchTasks = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: pagination.limit };
      if (statusFilter) params.status = statusFilter;
      const { data } = await taskApi.getTasks(params);
      setTasks(data.data.tasks);
      setPagination(data.data.pagination);
    } catch {
      toast.error('Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, pagination.limit]);

  useEffect(() => {
    fetchTasks(1);
  }, [statusFilter]);

  // Real-time Socket Subscriptions
  useEffect(() => {
    if (!socket) return;

    const handleTaskCreated = (newTask) => {
      setTasks((prev) => [newTask, ...prev]);
    };

    const handleTaskUpdated = (updatedTask) => {
      setTasks((prev) => prev.map(t => t._id === updatedTask._id ? updatedTask : t));
    };

    const handleTaskMoved = (movedTask) => {
      setTasks((prev) => prev.map(t => t._id === movedTask._id ? movedTask : t));
    };

    const handleTaskDeleted = (deletedTask) => {
      setTasks((prev) => prev.filter(t => t._id !== deletedTask._id));
    };

    socket.on('taskCreated', handleTaskCreated);
    socket.on('taskUpdated', handleTaskUpdated);
    socket.on('taskMoved', handleTaskMoved);
    socket.on('taskDeleted', handleTaskDeleted);

    return () => {
      socket.off('taskCreated', handleTaskCreated);
      socket.off('taskUpdated', handleTaskUpdated);
      socket.off('taskMoved', handleTaskMoved);
      socket.off('taskDeleted', handleTaskDeleted);
    };
  }, [socket]);

  // CRUD handlers
  const handleCreate = async (payload) => {
    await taskApi.createTask(payload);
    toast.success('Task created!');
    fetchTasks(1);
  };

  const handleUpdate = async (payload) => {
    await taskApi.updateTask(editingTask._id, payload);
    toast.success('Task updated!');
    fetchTasks(pagination.page);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await taskApi.deleteTask(id);
      toast.success('Task deleted');
      fetchTasks(pagination.page);
    } catch {
      toast.error('Failed to delete task');
    }
  };

  const openCreate = () => { setEditingTask(null); setShowModal(true); };
  const openEdit = (task) => { setEditingTask(task); setShowModal(true); };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id;
    const overId = over.id;

    const activeTask = tasks.find(t => t._id === taskId);
    if (!activeTask) return;

    const destinationStatus = ['todo', 'in-progress', 'in-review', 'done'].includes(overId)
      ? overId
      : tasks.find(t => t._id === overId)?.status;

    if (destinationStatus && activeTask.status !== destinationStatus) {
      setTasks(tasks.map(t => t._id === taskId ? { ...t, status: destinationStatus } : t));
      try {
        await taskApi.updateTask(taskId, { status: destinationStatus });
        toast.success(`Task moved to ${destinationStatus.replace('-', ' ')}`);
      } catch {
        toast.error('Failed to move task');
        fetchTasks(pagination.page);
      }
    }
  };

  const columns = ['todo', 'in-progress', 'in-review', 'done'];
  const groupedTasks = columns.reduce((acc, status) => {
    acc[status] = tasks.filter(t => t.status === status) || [];
    return acc;
  }, {});

  return (
    <div className="font-sans min-h-screen bg-surface-50 dark:bg-surface-950 transition-colors duration-300">
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ─── Header ─── */}
        {/* ─── Header ─── */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black text-surface-900 dark:text-white tracking-tight flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center">
                <LayoutGrid className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              Task Board
            </h1>
            <p className="text-surface-500 dark:text-surface-400 font-medium mt-1.5 text-sm flex items-center gap-1.5 pl-12">
              <Sparkles className="w-3.5 h-3.5" />
              Track and manage your workflow — {pagination.total} task{pagination.total !== 1 ? 's' : ''}
            </p>
          </div>
          <Button
            onClick={openCreate}
            className="px-5 gap-2 shadow-md shadow-primary-500/15 hover:shadow-lg hover:shadow-primary-500/25 active:scale-[0.97] transition-all duration-150"
            size="md"
          >
            <Plus className="w-4 h-4" />
            New Task
          </Button>
        </div>

        {/* ─── Filter Pills ─── */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-1 scrollbar-none">
          <Filter className="w-4 h-4 text-surface-400 dark:text-surface-500 shrink-0 mr-0.5" />
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-4 py-2 rounded-full text-xs font-bold tracking-wide whitespace-nowrap transition-all duration-200 border ${statusFilter === f.value
                  ? 'bg-primary-600 text-white border-primary-600 shadow-sm shadow-primary-500/20'
                  : 'bg-white dark:bg-surface-800 text-surface-600 dark:text-surface-400 border-surface-200/70 dark:border-surface-700/70 hover:border-primary-300 dark:hover:border-primary-700 hover:text-primary-600 dark:hover:text-primary-400 hover:scale-105'
                }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* ─── Board ─── */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-surface-50 dark:bg-surface-900/50 border border-surface-200 dark:border-surface-800 rounded-2xl overflow-hidden animate-pulse">
                <div className="p-4 border-b border-surface-200 dark:border-surface-800">
                  <div className="h-4 bg-surface-200 dark:bg-surface-700 rounded w-20" />
                </div>
                <div className="p-3 space-y-3">
                  <div className="h-20 bg-surface-100 dark:bg-surface-800 rounded-xl" />
                  <div className="h-20 bg-surface-100 dark:bg-surface-800 rounded-xl" />
                  <div className="h-16 bg-surface-100/60 dark:bg-surface-800/50 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : tasks.length === 0 && !statusFilter ? (
          <div className="text-center py-24 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl shadow-sm">
            <Inbox className="w-16 h-16 text-surface-300 dark:text-surface-600 mx-auto mb-5" />
            <h3 className="text-xl font-bold text-surface-900 dark:text-white mb-2">No tasks yet</h3>
            <p className="text-surface-500 dark:text-surface-400 font-medium mb-8 max-w-sm mx-auto">
              Create your first task to get started with your Task Board.
            </p>
            <Button onClick={openCreate} className="px-6 gap-2" size="md">
              <Plus className="w-4 h-4" /> Create Task
            </Button>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
              {columns.map(status => (
                <KanbanColumn
                  key={status}
                  id={status}
                  tasks={groupedTasks[status]}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </DndContext>
        )}

        {/* ─── Pagination ─── */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-10">
            <Button
              onClick={() => fetchTasks(pagination.page - 1)}
              disabled={pagination.page <= 1}
              variant="outline"
              size="sm"
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Prev
            </Button>
            <span className="text-sm font-medium text-surface-500 dark:text-surface-400 flex items-center">
              Page <span className="text-surface-900 dark:text-white font-bold mx-1.5">{pagination.page}</span> of
              <span className="text-surface-900 dark:text-white font-bold mx-1.5">{pagination.totalPages}</span>
            </span>
            <Button
              onClick={() => fetchTasks(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              variant="outline"
              size="sm"
            >
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}
      </main>

      {/* Create / Edit Modal */}
      <TaskModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingTask(null); }}
        onSubmit={editingTask ? handleUpdate : handleCreate}
        task={editingTask}
      />
    </div>
  );
}
