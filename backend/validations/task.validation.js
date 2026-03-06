const { z } = require('zod');

const createTaskSchema = z.object({
  title: z
    .string({ required_error: 'Title is required' })
    .trim()
    .min(3, 'Title must be at least 3 characters')
    .max(150, 'Title cannot exceed 150 characters'),

  description: z
    .string()
    .trim()
    .max(2000, 'Description cannot exceed 2000 characters')
    .optional()
    .default(''),

  status: z
    .enum(['todo', 'in-progress', 'in-review', 'done'], {
      invalid_type_error: 'Status must be one of: todo, in-progress, in-review, done',
    })
    .optional()
    .default('todo'),

  priority: z
    .enum(['low', 'medium', 'high', 'critical'], {
      invalid_type_error: 'Priority must be one of: low, medium, high, critical',
    })
    .optional()
    .default('medium'),

  dueDate: z
    .string()
    .datetime({ message: 'Due date must be a valid ISO 8601 date' })
    .optional()
    .nullable(),
});

const updateTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Title must be at least 3 characters')
    .max(150, 'Title cannot exceed 150 characters')
    .optional(),

  description: z
    .string()
    .trim()
    .max(2000, 'Description cannot exceed 2000 characters')
    .optional(),

  status: z
    .enum(['todo', 'in-progress', 'in-review', 'done'], {
      invalid_type_error: 'Status must be one of: todo, in-progress, in-review, done',
    })
    .optional(),

  priority: z
    .enum(['low', 'medium', 'high', 'critical'], {
      invalid_type_error: 'Priority must be one of: low, medium, high, critical',
    })
    .optional(),

  dueDate: z
    .string()
    .datetime({ message: 'Due date must be a valid ISO 8601 date' })
    .optional()
    .nullable(),
});

module.exports = {
  createTaskSchema,
  updateTaskSchema,
};
