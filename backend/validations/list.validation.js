const { z } = require('zod');

// --- Helper: MongoDB ObjectId string ---
const objectId = z
  .string({ required_error: 'ID is required' })
  .regex(/^[0-9a-fA-F]{24}$/, 'Must be a valid ObjectId');

const createListSchema = z.object({
  title: z
    .string({ required_error: 'List title is required' })
    .trim()
    .min(1, 'List title cannot be empty')
    .max(100, 'List title cannot exceed 100 characters'),
  board: objectId,
  order: z.number().optional().default(0),
});

module.exports = {
  createListSchema,
};
