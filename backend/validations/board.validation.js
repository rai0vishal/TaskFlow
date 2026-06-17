const { z } = require('zod');

// --- Helper: MongoDB ObjectId string ---
const objectId = z
  .string({ required_error: 'ID is required' })
  .regex(/^[0-9a-fA-F]{24}$/, 'Must be a valid ObjectId');

const createBoardSchema = z.object({
  title: z
    .string({ required_error: 'Board title is required' })
    .trim()
    .min(1, 'Board title cannot be empty')
    .max(100, 'Board title cannot exceed 100 characters'),
  workspaceId: objectId,
  description: z
    .string()
    .trim()
    .max(500, 'Description cannot exceed 500 characters')
    .optional()
    .default(''),
});

module.exports = {
  createBoardSchema,
};
