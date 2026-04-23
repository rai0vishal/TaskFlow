const router = require('express').Router();
const taskController = require('../controllers/task.controller');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createTaskSchema, updateTaskSchema } = require('../validations/task.validation');

// All task routes require authentication
router.use(authenticate);

/**
 * POST   /api/v1/tasks       — Create a new task
 * GET    /api/v1/tasks/:workspaceId — List tasks (paginated, filterable by status)
 */
router
  .route('/')
  .post(validate(createTaskSchema), taskController.createTask)

router.get('/workspace/:workspaceId', taskController.getTasks);

router.patch('/assign', taskController.assignTask);

/**
 * GET    /api/v1/tasks/:id   — Get task by ID
 * PUT    /api/v1/tasks/:id   — Update task
 * DELETE /api/v1/tasks/:id   — Delete task
 */
router
  .route('/:id')
  .get(taskController.getTaskById)
  .put(validate(updateTaskSchema), taskController.updateTask)
  .delete(taskController.deleteTask);

/**
 * GET    /api/v1/tasks/:id/activity — Get activity log for task
 */
router.get('/:id/activity', taskController.getTaskActivity);

module.exports = router;
