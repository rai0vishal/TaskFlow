const { z } = require('zod');

// --- Helper: MongoDB ObjectId string ---
const objectId = z
  .string({ required_error: 'ID is required' })
  .regex(/^[0-9a-fA-F]{24}$/, 'Must be a valid ObjectId');

// ========================
// Workspace CRUD
// ========================

const createWorkspaceSchema = z.object({
  name: z
    .string({ required_error: 'Workspace name is required' })
    .trim()
    .min(2, 'Workspace name must be at least 2 characters')
    .max(50, 'Workspace name cannot exceed 50 characters'),
});

const updateWorkspaceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Workspace name must be at least 2 characters')
    .max(50, 'Workspace name cannot exceed 50 characters')
    .optional(),
});

// ========================
// Member management
// ========================

const inviteMemberSchema = z.object({
  workspaceId: objectId,
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .email('Please provide a valid email address')
    .toLowerCase(),
});

const changeRoleSchema = z.object({
  workspaceId: objectId,
  userId: objectId,
  role: z.enum(['admin', 'member'], {
    invalid_type_error: 'Role must be either admin or member',
  }),
});

const transferOwnershipSchema = z.object({
  newOwnerId: objectId,
});

module.exports = {
  createWorkspaceSchema,
  updateWorkspaceSchema,
  inviteMemberSchema,
  changeRoleSchema,
  transferOwnershipSchema,
};
