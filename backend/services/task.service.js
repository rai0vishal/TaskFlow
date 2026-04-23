const Task = require('../models/Task');
const TaskActivity = require('../models/TaskActivity');
const Workspace = require('../models/Workspace');
const ApiError = require('../utils/ApiError');
const socketModule = require('../socket');
const calculatePriority = require('../utils/priorityCalculator');
const cache = require('../utils/cache');

const emitTaskEvent = (event, task) => {
  try {
    const io = socketModule.getIO();
    if (task.workspace) {
      io.to(`workspace_${task.workspace}`).emit(event, task);
    }
  } catch (error) {
    // Silently continue if socket isn't ready
  }
};

/**
 * Helper to check if a user is a member of the workspace and what their role is.
 */
const getWorkspaceUserRole = async (workspaceId, userId) => {
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) throw ApiError.notFound('Workspace not found');
  
  const member = workspace.members.find(m => m.user.toString() === userId.toString());
  if (!member) throw ApiError.forbidden('You are not a member of this workspace');
  
  return { workspace, memberRole: member.role };
};

const createTask = async (data, userId) => {
  if (!data.workspace) {
    throw ApiError.badRequest('Workspace is required to create a task');
  }

  await getWorkspaceUserRole(data.workspace, userId);

  if (data.assignedTo) {
    const { workspace } = await getWorkspaceUserRole(data.workspace, userId);
    const isAssigneeMember = workspace.members.some(m => m.user.toString() === data.assignedTo.toString());
    if (!isAssigneeMember) throw ApiError.badRequest('Assigned user is not a member of this workspace');
  }

  const activeTasksCount = await Task.countDocuments({
    assignedTo: data.assignedTo || userId,
    status: { $in: ['todo', 'in-progress'] },
    workspace: data.workspace
  });

  const { priorityScore, priorityLabel } = calculatePriority({
    dueDate: data.dueDate,
    complexity: data.complexity || 'Medium',
    activeTasksCount
  });

  const task = await Task.create({
    ...data,
    priorityScore,
    priorityLabel,
    createdBy: userId
  });

  await TaskActivity.create({
    task: task._id,
    action: 'created',
    performedBy: userId,
    details: { message: 'Task created' },
  });

  const populatedTask = await Task.findById(task._id)
    .populate('createdBy', 'name email')
    .populate('assignedTo', 'name email');

  cache.invalidateWorkspaceCache(data.workspace);

  emitTaskEvent('taskCreated', populatedTask);
  return populatedTask;
};

/**
 * Get paginated & filtered list of tasks for a specific WORKSPACE
 */
const getTasks = async (workspaceId, query, user) => {
  await getWorkspaceUserRole(workspaceId, user._id);

  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 100);
  const skip = (page - 1) * limit;

  const filter = { workspace: workspaceId };

  if (query.status) {
    const validStatuses = ['todo', 'in-progress', 'in-review', 'done'];
    if (validStatuses.includes(query.status)) {
      filter.status = query.status;
    }
  }

  const [tasks, total] = await Promise.all([
    Task.find(filter)
      .sort({ priorityScore: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .lean(),
    Task.countDocuments(filter),
  ]);

  return {
    tasks,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get a single task by ID.
 * Enforces ownership inside workspace context.
 */
const getTaskById = async (taskId, user) => {
  const task = await Task.findById(taskId)
    .populate('createdBy', 'name email')
    .populate('assignedTo', 'name email')
    .lean();

  if (!task) {
    throw ApiError.notFound('Task not found');
  }

  await getWorkspaceUserRole(task.workspace, user._id);

  return task;
};

/**
 * Update a task by ID.
 * RBAC: Any member of the workspace can update fields.
 */
const updateTask = async (taskId, data, user) => {
  const task = await Task.findById(taskId);
  if (!task) throw ApiError.notFound('Task not found');

  await getWorkspaceUserRole(task.workspace, user._id);

  const changes = {};
  const updatableFields = ['title', 'description', 'status', 'complexity', 'dueDate', 'assignedTo'];
  let priorityChanged = false;

  updatableFields.forEach((field) => {
    if (data[field] !== undefined && data[field] !== task[field]?.toString()) {
      changes[field] = { old: task[field], new: data[field] };
    }
  });

  // Automatically recalculate priority if metrics change
  if (changes.dueDate || changes.complexity || changes.status || changes.assignedTo) {
    const activeTasksCount = await Task.countDocuments({
      assignedTo: data.assignedTo !== undefined ? data.assignedTo : task.assignedTo,
      status: { $in: ['todo', 'in-progress'] },
      workspace: task.workspace
    });

    const { priorityScore, priorityLabel } = calculatePriority({
      dueDate: data.dueDate !== undefined ? data.dueDate : task.dueDate,
      complexity: data.complexity !== undefined ? data.complexity : task.complexity,
      activeTasksCount
    });

    if (task.priorityScore !== priorityScore || task.priorityLabel !== priorityLabel) {
      changes.priorityLabel = { old: task.priorityLabel, new: priorityLabel };
      data.priorityScore = priorityScore;
      data.priorityLabel = priorityLabel;
      priorityChanged = true;
    }
  }

  Object.assign(task, data);
  await task.save();

  if (Object.keys(changes).length > 0) {
    await TaskActivity.create({
      task: task._id,
      action: 'updated',
      performedBy: user._id,
      details: changes,
    });
  }

  const populatedTask = await Task.findById(task._id).populate('createdBy', 'name email').populate('assignedTo', 'name email');
  
  cache.invalidateWorkspaceCache(task.workspace);

  // Custom event for drag and drop moves if status changed
  if (changes.status && !priorityChanged) {
    emitTaskEvent('taskMoved', populatedTask);
  } else {
    emitTaskEvent('taskUpdated', populatedTask);
  }

  return populatedTask;
};

/**
 * Delete a task by ID.
 * RBAC: Admin can delete any task. Member can ONLY delete their own tasks.
 */
const deleteTask = async (taskId, user) => {
  const task = await Task.findById(taskId);
  if (!task) throw ApiError.notFound('Task not found');

  const { memberRole } = await getWorkspaceUserRole(task.workspace, user._id);

  if (memberRole !== 'admin' && task.createdBy.toString() !== user._id.toString()) {
    throw ApiError.forbidden('Not authorized to delete this task');
  }

  await TaskActivity.create({
    task: task._id,
    action: 'deleted',
    performedBy: user._id,
    details: { taskTitle: task.title },
  });

  await task.deleteOne();

  cache.invalidateWorkspaceCache(task.workspace);

  emitTaskEvent('taskDeleted', task);
};

const getTaskActivity = async (taskId, user) => {
  const task = await Task.findById(taskId);
  if (!task) throw ApiError.notFound('Task not found');
  
  await getWorkspaceUserRole(task.workspace, user._id);

  const activities = await TaskActivity.find({ task: taskId })
    .sort({ createdAt: -1 })
    .populate('performedBy', 'name email')
    .lean();

  return activities;
};

const assignTask = async (taskId, assignedTo, user) => {
  const task = await Task.findById(taskId);
  if (!task) throw ApiError.notFound('Task not found');
  if (!task.workspace) throw ApiError.badRequest('Task is not part of a workspace');

  const { workspace } = await getWorkspaceUserRole(task.workspace, user._id);

  const isMember = workspace.members.some((m) => m.user.toString() === assignedTo.toString());
  if (!isMember) {
    throw ApiError.badRequest('Assigned user is not a member of this workspace');
  }

  task.assignedTo = assignedTo;
  await task.save();

  await TaskActivity.create({
    task: task._id,
    action: 'updated',
    performedBy: user._id,
    details: { message: 'Task assigned', assignedTo },
  });

  const populatedTask = await Task.findById(task._id).populate('createdBy', 'name email').populate('assignedTo', 'name email');
  
  cache.invalidateWorkspaceCache(task.workspace);

  emitTaskEvent('task_assigned', populatedTask);

  return populatedTask;
};

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  getTaskActivity,
  assignTask,
};
