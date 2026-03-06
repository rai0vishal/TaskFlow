import { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import TaskCard from '../components/TaskCard';
import TaskModal from '../components/TaskModal';
import * as taskApi from '../api/tasks';
import toast from 'react-hot-toast';
import { Plus, Search, Filter, ChevronLeft, ChevronRight, Inbox } from 'lucide-react';

const STATUS_FILTERS = [
  { label: 'All', value: '' },
  { label: 'To Do', value: 'todo' },
  { label: 'In Progress', value: 'in-progress' },
  { label: 'In Review', value: 'in-review' },
  { label: 'Done', value: 'done' },
];

export default function TaskManagement() {
  const [tasks, setTasks] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 9, total: 0, totalPages: 1 });
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="min-h-screen bg-surface-50 font-sans">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-surface-900 tracking-tight">Tasks</h1>
            <p className="text-surface-500 font-medium mt-1">{pagination.total} total task{pagination.total !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-primary-600 text-white shadow-md shadow-primary-500/20 hover:shadow-lg hover:shadow-primary-500/30 hover:bg-primary-700 transition-all duration-300 active:scale-95"
          >
            <Plus className="w-5 h-5" />
            New Task
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <Filter className="w-4 h-4 text-surface-500" />
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                statusFilter === f.value
                  ? 'bg-primary-50 text-primary-600 ring-1 ring-primary-500/30 shadow-sm'
                  : 'text-surface-500 hover:text-surface-900 hover:bg-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Task Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white border border-surface-200 rounded-2xl p-6 shadow-sm animate-pulse">
                <div className="h-5 bg-surface-200 rounded w-3/4 mb-4" />
                <div className="h-4 bg-surface-100 rounded w-full mb-3" />
                <div className="h-4 bg-surface-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-20 bg-white border border-surface-200 rounded-2xl shadow-sm">
            <Inbox className="w-16 h-16 text-surface-300 mx-auto mb-5" />
            <h3 className="text-xl font-bold text-surface-900 mb-2">No tasks found</h3>
            <p className="text-surface-500 font-medium mb-8 max-w-sm mx-auto">
              {statusFilter ? 'Try changing the filter.' : 'Create your first task to get started.'}
            </p>
            {!statusFilter && (
              <button
                onClick={openCreate}
                className="px-6 py-3 rounded-xl text-sm font-semibold bg-primary-600 text-white shadow-md shadow-primary-500/20 hover:shadow-lg hover:bg-primary-700 transition-all duration-300 active:scale-95"
              >
                <Plus className="w-4 h-4 inline mr-1" /> Create Task
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tasks.map((task) => (
              <TaskCard key={task._id} task={task} onEdit={openEdit} onDelete={handleDelete} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-8">
            <button
              onClick={() => fetchTasks(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-semibold text-surface-600 bg-white border border-surface-200 shadow-sm hover:bg-surface-50 hover:text-surface-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" /> Prev
            </button>
            <span className="text-sm font-medium text-surface-500">
              Page <span className="text-surface-900 font-bold">{pagination.page}</span> of{' '}
              <span className="text-surface-900 font-bold">{pagination.totalPages}</span>
            </span>
            <button
              onClick={() => fetchTasks(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-semibold text-surface-600 bg-white border border-surface-200 shadow-sm hover:bg-surface-50 hover:text-surface-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
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
