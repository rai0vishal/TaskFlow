const { z } = require('zod');

// --- Helper: MongoDB ObjectId string ---
const objectId = z
  .string({ required_error: 'ID is required' })
  .regex(/^[0-9a-fA-F]{24}$/, 'Must be a valid ObjectId');

// ========================
// Invite operations
// ========================

const sendInviteSchema = z.object({
  workspaceId: objectId,
  receiverEmail: z
    .string({ required_error: 'Receiver email is required' })
    .trim()
    .email('Please provide a valid email address')
    .toLowerCase(),
  message: z
    .string()
    .trim()
    .max(500, 'Invite message cannot exceed 500 characters')
    .optional()
    .default(''),
});

const inviteActionSchema = z.object({
  inviteId: objectId,
});

module.exports = {
  sendInviteSchema,
  inviteActionSchema,
};
