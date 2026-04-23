const Workspace = require('../models/Workspace');
const User = require('../models/User');
const Message = require('../models/Message');
const ApiError = require('../utils/ApiError');

const createWorkspace = async (data, userId) => {
  return await Workspace.create({ ...data, owner: userId, members: [{ user: userId, role: 'admin' }] });
};

const getWorkspaces = async (user) => {
  const filter = user.role === 'admin' ? { isDeleted: false } : { 'members.user': user._id, isDeleted: false };
  return await Workspace.find(filter)
    .populate('owner', 'name email')
    .populate('members.user', 'name email')
    .sort({ createdAt: -1 });
};

const inviteMember = async (workspaceId, email) => {
  const user = await User.findOne({ email });
  if (!user) throw ApiError.notFound('User not found');

  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) throw ApiError.notFound('Workspace not found');

  const isMember = workspace.members.some((m) => m.user.toString() === user._id.toString());
  if (isMember) throw ApiError.badRequest('User is already a member of this workspace');

  workspace.members.push({ user: user._id, role: 'member' });
  await workspace.save();

  return await Workspace.findById(workspaceId).populate('members.user', 'name email role');
};

const getMembers = async (workspaceId) => {
  const workspace = await Workspace.findById(workspaceId).populate('members.user', 'name email role');
  if (!workspace) throw ApiError.notFound('Workspace not found');
  return workspace.members;
};

const changeRole = async (workspaceId, targetUserId, newRole) => {
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) throw ApiError.notFound('Workspace not found');

  const memberIndex = workspace.members.findIndex((m) => m.user.toString() === targetUserId.toString());
  if (memberIndex === -1) throw ApiError.notFound('User is not a member of this workspace');

  if (newRole === 'member') {
    // Cannot remove last admin
    const adminCount = workspace.members.filter((m) => m.role === 'admin').length;
    if (adminCount <= 1 && workspace.members[memberIndex].role === 'admin') {
      throw ApiError.badRequest('Cannot change the role of the last admin');
    }
  }

  workspace.members[memberIndex].role = newRole;
  await workspace.save();
  return workspace.members[memberIndex];
};
/**
 * Get workspace summaries: workspaces with last message + unread count.
 * This is used for the sidebar/workspace list to show real-time activity.
 */
const getWorkspaceSummaries = async (user) => {
  const filter = user.role === 'admin' ? { isDeleted: false } : { 'members.user': user._id, isDeleted: false };
  const workspaces = await Workspace.find(filter)
    .populate('owner', 'name email')
    .populate('members.user', 'name email')
    .sort({ createdAt: -1 })
    .lean();

  // Get last message and unread count for each workspace in parallel for performance
  const summaries = await Promise.all(
    workspaces.map(async (ws) => {
      const [lastMessage, unreadCount] = await Promise.all([
        Message.findOne({ workspace: ws._id })
          .sort({ createdAt: -1 })
          .select('text sender createdAt')
          .populate('sender', 'name')
          .lean(),
        Message.countDocuments({
          workspace: ws._id,
          seenBy: { $ne: user._id },
          sender: { $ne: user._id },
        }),
      ]);

      return {
        ...ws,
        lastMessage: lastMessage
          ? {
              text: lastMessage.text,
              senderName: lastMessage.sender?.name || 'Unknown',
              createdAt: lastMessage.createdAt,
            }
          : null,
        unreadCount,
      };
    })
  );

  return summaries;
};

const updateWorkspace = async (workspaceId, data) => {
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) throw ApiError.notFound('Workspace not found');

  Object.assign(workspace, data);
  await workspace.save();
  return workspace;
};

const deleteWorkspace = async (workspaceId, userId) => {
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) throw ApiError.notFound('Workspace not found');

  // Strict security check: Only the workspace owner can delete it
  if (workspace.owner.toString() !== userId.toString()) {
    throw ApiError.forbidden('Only the workspace owner can delete it');
  }

  workspace.isDeleted = true;
  workspace.deletedAt = new Date();
  await workspace.save();

  return workspace;
};

const restoreWorkspace = async (workspaceId, userId) => {
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) throw ApiError.notFound('Workspace not found');

  if (workspace.owner.toString() !== userId.toString()) {
    throw ApiError.forbidden('Only the workspace owner can restore it');
  }

  workspace.isDeleted = false;
  workspace.deletedAt = null;
  await workspace.save();

  return workspace;
};

const leaveWorkspace = async (workspaceId, userId) => {
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) throw ApiError.notFound('Workspace not found');

  const memberIndex = workspace.members.findIndex((m) => m.user.toString() === userId.toString());
  if (memberIndex === -1) throw ApiError.badRequest('You are not a member of this workspace');

  const memberRole = workspace.members[memberIndex].role;

  // Prevent the last admin from leaving without handing over control
  if (memberRole === 'admin') {
    const adminCount = workspace.members.filter((m) => m.role === 'admin').length;
    if (adminCount <= 1) {
      throw ApiError.badRequest('You are the last admin. Transfer ownership or delete the workspace before leaving.');
    }
  }

  workspace.members.splice(memberIndex, 1);
  await workspace.save();

  return workspace;
};

/**
 * Hand over ownership of a workspace to another member.
 */
const transferOwnership = async (workspaceId, currentOwnerId, newOwnerId) => {
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) throw ApiError.notFound('Workspace not found');

  if (workspace.owner.toString() !== currentOwnerId.toString()) {
    throw ApiError.forbidden('Only the owner can transfer ownership');
  }

  // Ensure new owner is already a member of the workspace
  const newOwnerMember = workspace.members.find(m => m.user.toString() === newOwnerId.toString());
  if (!newOwnerMember) throw ApiError.badRequest('New owner must be a member of the workspace');

  workspace.owner = newOwnerId;
  // New owner must have admin privileges
  newOwnerMember.role = 'admin';
  
  await workspace.save();
  return workspace;
};

const rejoinWorkspace = async (workspaceId, userId) => {
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) throw ApiError.notFound('Workspace not found');

  // Check if already a member
  const isMember = workspace.members.some((m) => m.user.toString() === userId.toString());
  if (isMember) return workspace;

  // Add back as member
  workspace.members.push({ user: userId, role: 'member' });
  await workspace.save();

  return workspace;
};

module.exports = { 
  createWorkspace, 
  getWorkspaces, 
  getWorkspaceSummaries, 
  inviteMember, 
  getMembers, 
  changeRole,
  updateWorkspace,
  deleteWorkspace,
  restoreWorkspace,
  leaveWorkspace,
  transferOwnership,
  rejoinWorkspace
};
