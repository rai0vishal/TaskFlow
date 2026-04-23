import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSocket } from '../context/SocketContext';
import TaskCard from '../components/TaskCard';
import TaskModal from '../components/TaskModal';
import Button from '../components/Button';
import * as taskApi from '../api/tasks';
import toast from 'react-hot-toast';
import { Plus, Filter, ChevronLeft, ChevronRight, Inbox, LayoutGrid, Sparkles, Users, MessageSquare, Search, X, User } from 'lucide-react';
import { DndContext, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import KanbanColumn from '../components/KanbanColumn';
import TeamPanel from '../components/TeamPanel';
import WorkspaceChatPanel from '../components/WorkspaceChatPanel';
import TaskDetailPanel from '../components/TaskDetailPanel';
import TaskActivityPanel from '../components/TaskActivityPanel';
import { useWorkspace } from '../context/WorkspaceContext';
import { SkeletonCard } from '../components/LoadingStates';
import EmptyState from '../components/EmptyState';
import { useAuth } from '../context/AuthContext';

const STATUS_FILTERS = [
  { label: 'All', value: '', icon: LayoutGrid },
  { label: 'To Do', value: 'todo' },
  { label: 'In Progress', value: 'in-progress' },
  { label: 'In Review', value: 'in-review' },
  { label: 'Done', value: 'done' },
];

export default function TaskManagement() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 1 });
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [assignedToMe, setAssignedToMe] = useState(false);
  const [loading, setLoading] = useState(true);
  const { socket, joinWorkspaceRoom } = useSocket();

  // Modal state
  // Modal / Side Panel state
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showDetailPanel, setShowDetailPanel] = useState(false);

  // Workspace state
  const { activeWorkspace: workspace, isSwitching, loadingWorkspace } = useWorkspace();
  const [showTeamPanel, setShowTeamPanel] = useState(false);
  const [showChatPanel, setShowChatPanel] = useState(false);
  const [showActivityPanel, setShowActivityPanel] = useState(false);
  const [workspaceMembers, setWorkspaceMembers] = useState([]);

  const fetchTasks = useCallback(async (page = 1) => {
    if (!workspace?._id) return;
    setLoading(true);
    try {
      const params = { page, limit: pagination.limit, workspace: workspace._id };
      if (statusFilter) params.status = statusFilter;
      if (searchQuery) params.search = searchQuery;
      if (assignedToMe) params.assignedTo = user._id;

      const { data } = await taskApi.getTasks(params);
      setTasks(data.data.tasks);
      setPagination(data.data.pagination);
    } catch {
      toast.error('Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, pagination.limit, workspace?._id]);



  useEffect(() => {
    if (loadingWorkspace) return;

    if (isSwitching) {
      setTasks([]);
      return;
    }

    if (workspace?._id) {
      joinWorkspaceRoom(workspace._id);
      fetchTasks(1);
    } else {
      setLoading(false);
    }
  }, [workspace?._id, isSwitching, statusFilter, fetchTasks, joinWorkspaceRoom, loadingWorkspace]);

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

    const handleTaskAssigned = (data) => {
      setTasks((prev) => prev.map(t => t._id === data.taskId ? { ...t, assignedTo: data.assignedTo } : t));
    };

    socket.on('taskCreated', handleTaskCreated);
    socket.on('taskUpdated', handleTaskUpdated);
    socket.on('taskMoved', handleTaskMoved);
    socket.on('taskDeleted', handleTaskDeleted);
    socket.on('task_assigned', handleTaskAssigned);

    return () => {
      socket.off('taskCreated', handleTaskCreated);
      socket.off('taskUpdated', handleTaskUpdated);
      socket.off('taskMoved', handleTaskMoved);
      socket.off('taskDeleted', handleTaskDeleted);
      socket.off('task_assigned', handleTaskAssigned);
    };
  }, [socket]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Focus search on '/'
      if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        document.getElementById('task-search')?.focus();
      }
      // New task on 'n' or 'N'
      if ((e.key === 'n' || e.key === 'N') && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        openCreate();
      }
      if (e.key === 'Escape') {
        setShowDetailPanel(false);
        setSelectedTask(null);
        setShowModal(false);
        setEditingTask(null);
        setShowActivityPanel(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-new-task', openCreate);

    // Handle query param
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'new-task') {
      openCreate();
      // Clear param
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-new-task', openCreate);
    };
  }, []);

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
  const openDetail = (task) => { setSelectedTask(task); setShowDetailPanel(true); };
  const openActivity = (task) => { setSelectedTask(task); setShowActivityPanel(true); };

  const canDeleteTask = useCallback((task) => {
    if (!task || !workspace || !user) return false;
    // Find current user's role in workspace
    const member = workspaceMembers.find(m => m.user?._id === user._id || m.user === user._id);
    const isAdmin = member?.role === 'admin';
    const isCreator = task.createdBy?._id === user._id || task.createdBy === user._id;
    return isAdmin || isCreator;
  }, [workspace, user, workspaceMembers]);

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
  const filteredTasks = useMemo(() => {
    let result = tasks;
    if (searchQuery) {
      result = result.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    if (assignedToMe) {
      result = result.filter(t => t.assignedTo?._id === user._id);
    }
    return result;
  }, [tasks, searchQuery, assignedToMe, user._id]);

  const groupedTasks = useMemo(() => columns.reduce((acc, status) => {
    acc[status] = filteredTasks.filter(t => t.status === status) || [];
    return acc;
  }, {}), [filteredTasks]);

  return (
    <div className="font-sans h-[calc(100vh-64px)] flex overflow-hidden bg-surface-50 dark:bg-surface-950 transition-colors duration-300">
      <div className="flex-1 overflow-y-auto">
        <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ─── Header ─── */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-3" style={{ color: 'var(--color-text-heading)' }}>
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
          <div className="flex gap-3">
            <Button
              onClick={() => { setShowChatPanel(!showChatPanel); setShowTeamPanel(false); }}
              variant="outline"
              className="px-5 gap-2 shadow-sm"
              size="md"
            >
              <MessageSquare className="w-4 h-4" />
              Chat
            </Button>
            <Button
              onClick={() => { setShowTeamPanel(!showTeamPanel); setShowChatPanel(false); }}
              variant="outline"
              className="px-5 gap-2 shadow-sm"
              size="md"
            >
              <Users className="w-4 h-4" />
              Team
            </Button>
            <Button
              onClick={openCreate}
              className="px-5 gap-2 shadow-md shadow-primary-500/15 hover:shadow-lg hover:shadow-primary-500/25 active:scale-[0.97] transition-all duration-150"
              size="md"
            >
              <Plus className="w-4 h-4" />
              New Task
            </Button>
          </div>
        </div>
        
        {/* ─── Search & Filters ─── */}
        <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-surface-400 dark:text-surface-500" />
            <input
              id="task-search"
              type="text"
              placeholder="Search tasks... (Press '/' to focus)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all dark:text-white"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 dark:hover:text-surface-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          <div className="filter-pills-row">
            <button
              onClick={() => setAssignedToMe(!assignedToMe)}
              style={{
                borderRadius: 'var(--radius-pill)',
                padding: '6px 14px',
                fontSize: '13px',
                fontWeight: 500,
                borderWidth: '0.5px',
                borderStyle: 'solid',
                transition: 'all 0.2s ease',
                ...(assignedToMe
                  ? {
                      background: 'var(--color-primary-light)',
                      color: 'var(--color-primary)',
                      borderColor: 'var(--color-primary)'
                    }
                  : {
                      background: 'transparent',
                      color: 'var(--color-text-muted)',
                      borderColor: 'var(--color-border)'
                    })
              }}
              className="flex items-center gap-2 whitespace-nowrap cursor-pointer hover:opacity-90 active:scale-95 shrink-0"
            >
              <User className="w-3.5 h-3.5" />
              Assigned to me
            </button>
            <div className="h-6 w-px bg-surface-200 dark:bg-surface-800 shrink-0 mx-1" />
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`px-4 py-2.5 rounded-[var(--radius-md)] text-[13px] font-[500] whitespace-nowrap transition-all border-[0.5px] shrink-0 ${statusFilter === f.value
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : 'bg-bg-card text-text-muted border-border hover:text-text-body hover:bg-bg-surface'
                  }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* ─── Board ─── */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {columns.map((status) => (
              <div key={status} className="bg-surface-100/50 dark:bg-surface-900/30 border border-surface-200/60 dark:border-surface-800/50 border-l-[3px] rounded-xl overflow-hidden p-3 pt-0">
                <div className="py-3 mb-2 flex items-center justify-between">
                  <div className="h-4 bg-surface-200 dark:bg-surface-800 rounded w-20 animate-pulse" />
                </div>
                <div className="space-y-3">
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                </div>
              </div>
            ))}
          </div>
        ) : (!workspace) ? (
          <div className="p-12">
            <EmptyState 
              icon={LayoutGrid}
              title="No active workspace"
              description="You need to select or create a workspace to manage tasks."
            />
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
            <div className="kanban-board">
              {columns.map(status => (
                <KanbanColumn
                  key={status}
                  id={status}
                  tasks={groupedTasks[status]}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  onClick={openDetail}
                  onViewActivity={openActivity}
                  canDelete={canDeleteTask}
                  workspaceMembers={workspaceMembers}
                  className="kanban-column"
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
      </div>

      {showChatPanel && workspace && (
        <>
          <div className="panel-backdrop" onClick={() => setShowChatPanel(false)} />
          <WorkspaceChatPanel
            workspaceId={workspace._id}
            workspaceName={workspace.name}
            onClose={() => setShowChatPanel(false)}
          />
        </>
      )}

      {showTeamPanel && workspace && (
        <>
          <div className="panel-backdrop" onClick={() => setShowTeamPanel(false)} />
          <TeamPanel
            workspace={workspace}
            onWorkspaceUpdate={(members) => setWorkspaceMembers(members)}
            onClose={() => setShowTeamPanel(false)}
          />
        </>
      )}

      {/* Create / Edit Modal */}
      <TaskModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingTask(null); }}
        onSubmit={(payload) => {
           // Inject workspace context
           const finalPayload = { ...payload, workspace: workspace?._id };
           return editingTask ? handleUpdate(finalPayload) : handleCreate(finalPayload);
        }}
        task={editingTask}
        workspaceMembers={workspaceMembers}
      />

      {/* Task Detail Side Panel */}
      <TaskDetailPanel
        task={tasks.find(t => t._id === selectedTask?._id) || selectedTask}
        isOpen={showDetailPanel}
        onClose={() => { setShowDetailPanel(false); setSelectedTask(null); }}
        onEdit={openEdit}
        onDelete={handleDelete}
        canDelete={canDeleteTask(tasks.find(t => t._id === selectedTask?._id) || selectedTask)}
        workspaceMembers={workspaceMembers}
      />

      {showActivityPanel && (
        <TaskActivityPanel
          task={selectedTask}
          isOpen={showActivityPanel}
          onClose={() => { setShowActivityPanel(false); setSelectedTask(null); }}
        />
      )}
    </div>
  );
}
