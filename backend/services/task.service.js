const Task = require('../models/Task');
const TaskActivity = require('../models/TaskActivity');
const ApiError = require('../utils/ApiError');
const socketModule = require('../socket');
const calculatePriority = require('../utils/priorityCalculator');

const emitTaskEvent = (event, task) => {
  try {
    const io = socketModule.getIO();
    if (task.board) {
      io.to(`board_${task.board}`).emit(event, task);
    }
    io.to(`user_${task.createdBy}`).emit(event, task);
  } catch (error) {
    // Silently continue if socket isn't ready
  }
};

const createTask = async (data, userId) => {
  // Determine user's current workload for smart priority
  const activeTasksCount = await Task.countDocuments({
    createdBy: userId,
    status: { $in: ['todo', 'in-progress'] }
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

  emitTaskEvent('taskCreated', task);
  return task;
};

/**
 * Get paginated & filtered list of tasks.
 * - Regular users see only their own tasks.
 * - Admins see all tasks.
 *
 * @param {object} query - { page, limit, status }
 * @param {object} user  - Authenticated user
 */
const getTasks = async (query, user) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 100);
  const skip = (page - 1) * limit;

  // Build filter
  const filter = {};

  // Ownership: non-admin users only see their own tasks
  if (user.role !== 'admin') {
    filter.createdBy = user._id;
  }

  // Optional status filter
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
      .populate('createdBy', 'name email'),
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
 * Enforces ownership for non-admin users.
 */
const getTaskById = async (taskId, user) => {
  const task = await Task.findById(taskId).populate('createdBy', 'name email');

  if (!task) {
    throw ApiError.notFound('Task not found');
  }

  // Ownership check
  if (user.role !== 'admin' && task.createdBy._id.toString() !== user._id.toString()) {
    throw ApiError.forbidden('You do not have access to this task');
  }

  return task;
};

/**
 * Update a task by ID.
 * Enforces ownership for non-admin users.
 */
const updateTask = async (taskId, data, user) => {
  const task = await Task.findById(taskId);

  if (!task) {
    throw ApiError.notFound('Task not found');
  }

  // Ownership check
  if (user.role !== 'admin' && task.createdBy.toString() !== user._id.toString()) {
    throw ApiError.forbidden('You do not have access to this task');
  }

  // Keep a record of changes
  const changes = {};
  const updatableFields = ['title', 'description', 'status', 'complexity', 'dueDate'];
  let priorityChanged = false;

  updatableFields.forEach((field) => {
    if (data[field] !== undefined && data[field] !== task[field]?.toString()) {
      changes[field] = { old: task[field], new: data[field] };
    }
  });

  // Automatically recalculate priority if metrics change
  if (changes.dueDate || changes.complexity || changes.status) {
    const activeTasksCount = await Task.countDocuments({
      createdBy: task.createdBy,
      status: { $in: ['todo', 'in-progress'] }
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

  const populatedTask = await task.populate('createdBy', 'name email');
  
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
 * Enforces ownership for non-admin users.
 */
const deleteTask = async (taskId, user) => {
  const task = await Task.findById(taskId);

  if (!task) {
    throw ApiError.notFound('Task not found');
  }

  // Ownership check
  if (user.role !== 'admin' && task.createdBy.toString() !== user._id.toString()) {
    throw ApiError.forbidden('You do not have access to this task');
  }

  // Create the deletion log before deleting
  await TaskActivity.create({
    task: task._id,
    action: 'deleted',
    performedBy: user._id,
    details: { taskTitle: task.title },
  });

  await task.deleteOne();
  emitTaskEvent('taskDeleted', task);
};

/**
 * Get activity history for a specific task.
 */
const getTaskActivity = async (taskId, user) => {
  const task = await Task.findById(taskId);
  if (!task) throw ApiError.notFound('Task not found');
  
  if (user.role !== 'admin' && task.createdBy.toString() !== user._id.toString()) {
    throw ApiError.forbidden('You do not have access to this task');
  }

  const activities = await TaskActivity.find({ task: taskId })
    .sort({ createdAt: -1 })
    .populate('performedBy', 'name email');

  return activities;
};

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  getTaskActivity,
};
