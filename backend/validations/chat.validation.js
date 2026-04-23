const { z } = require('zod');

// --- Helper: MongoDB ObjectId string ---
const objectId = z
  .string({ required_error: 'ID is required' })
  .regex(/^[0-9a-fA-F]{24}$/, 'Must be a valid ObjectId');

// ========================
// Chat messages
// ========================

const sendMessageSchema = z.object({
  workspaceId: objectId,
  text: z
    .string({ required_error: 'Message text is required' })
    .trim()
    .min(1, 'Message cannot be empty')
    .max(1000, 'Message cannot exceed 1000 characters'),
});

const markAsSeenSchema = z.object({
  messageId: objectId,
});

module.exports = {
  sendMessageSchema,
  markAsSeenSchema,
};
