const asyncHandler = require('../utils/asyncHandler');
const sendResponse = require('../utils/sendResponse');
const taskService =  require('../services/task.service');

/**
 * @route   POST /api/v1/tasks
 * @desc    Create a new task
 * @access  Private
 */
const createTask = asyncHandler(async (req, res) => {
  const task = await taskService.createTask(req.body, req.user._id);
  sendResponse(res, 201, 'Task created successfully', { task });
});

/**
 * @route   GET /api/v1/tasks/workspace/:workspaceId
 * @desc    Get all tasks for a specific workspace (paginated, filterable)
 * @access  Private
 */
const getTasks = asyncHandler(async (req, res) => {
  const result = await taskService.getTasks(req.params.workspaceId, req.query, req.user);
  sendResponse(res, 200, 'Tasks retrieved successfully', result);
});

/**
 * @route   GET /api/v1/tasks/:id
 * @desc    Get a single task by ID
 * @access  Private
 */
const getTaskById = asyncHandler(async (req, res) => {
  const task = await taskService.getTaskById(req.params.id, req.user);
  sendResponse(res, 200, 'Task retrieved successfully', { task });
});

/**
 * @route   PUT /api/v1/tasks/:id
 * @desc    Update a task
 * @access  Private
 */
const updateTask = asyncHandler(async (req, res) => {
  const task = await taskService.updateTask(req.params.id, req.body, req.user);
  sendResponse(res, 200, 'Task updated successfully', { task });
});

/**
 * @route   DELETE /api/v1/tasks/:id
 * @desc    Delete a task
 * @access  Private
 */
const deleteTask = asyncHandler(async (req, res) => {
  await taskService.deleteTask(req.params.id, req.user);
  sendResponse(res, 200, 'Task deleted successfully');
});

/**
 * @route   GET /api/v1/tasks/:id/activity
 * @desc    Get activity history for a task
 * @access  Private
 */
const getTaskActivity = asyncHandler(async (req, res) => {
  const activities = await taskService.getTaskActivity(req.params.id, req.user);
  sendResponse(res, 200, 'Task activity retrieved successfully', { activities });
});

/**
 * @route   POST /api/v1/tasks/assign
 * @desc    Assign a task to a user. Only workspace members can be assigned.
 * @access  Private
 */
const assignTask = asyncHandler(async (req, res) => {
  const { taskId, assignedTo } = req.body;
  const task = await taskService.assignTask(taskId, assignedTo, req.user);
  
  // Notify other clients about the task assignment in real-time via Socket.io
  const { getIO } = require('../socket');
  getIO().emit('task_assigned', { taskId, assignedTo: task.assignedTo });
  
  sendResponse(res, 200, 'Task assigned successfully', { task });
});

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  getTaskActivity,
  assignTask,
};
