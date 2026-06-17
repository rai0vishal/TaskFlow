const mongoose = require('mongoose');
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

  if (workspaces.length === 0) {
    return [];
  }

  const wsIds = workspaces.map((ws) => new mongoose.Types.ObjectId(ws._id));
  const userObjectId = new mongoose.Types.ObjectId(user._id);

  // Get last message and unread count for all workspaces in parallel via aggregation to avoid N+1 queries
  const [unreadCountsAgg, lastMessagesAgg] = await Promise.all([
    Message.aggregate([
      {
        $match: {
          workspace: { $in: wsIds },
          seenBy: { $ne: userObjectId },
          sender: { $ne: userObjectId }
        }
      },
      {
        $group: {
          _id: '$workspace',
          count: { $sum: 1 }
        }
      }
    ]),
    Message.aggregate([
      { $match: { workspace: { $in: wsIds } } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$workspace',
          lastMsg: { $first: '$$ROOT' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'lastMsg.sender',
          foreignField: '_id',
          as: 'senderInfo'
        }
      },
      {
        $project: {
          _id: 1,
          text: '$lastMsg.text',
          createdAt: '$lastMsg.createdAt',
          senderName: { $arrayElemAt: ['$senderInfo.name', 0] }
        }
      }
    ])
  ]);

  const unreadMap = {};
  unreadCountsAgg.forEach((item) => {
    unreadMap[item._id.toString()] = item.count;
  });

  const lastMsgMap = {};
  lastMessagesAgg.forEach((item) => {
    lastMsgMap[item._id.toString()] = {
      text: item.text,
      senderName: item.senderName || 'Unknown',
      createdAt: item.createdAt
    };
  });

  const summaries = workspaces.map((ws) => {
    const wsIdStr = ws._id.toString();
    return {
      ...ws,
      lastMessage: lastMsgMap[wsIdStr] || null,
      unreadCount: unreadMap[wsIdStr] || 0
    };
  });

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
  
  // Track that this user left the workspace to authorize potential rejoining later
  if (!workspace.leftMembers) {
    workspace.leftMembers = [];
  }
  if (!workspace.leftMembers.some(id => id.toString() === userId.toString())) {
    workspace.leftMembers.push(userId);
  }
  
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

  // Security Hardening: Only allow rejoins if user is in leftMembers history or is the workspace owner
  const isOwner = workspace.owner.toString() === userId.toString();
  const hasLeftHistory = workspace.leftMembers && workspace.leftMembers.some(id => id.toString() === userId.toString());

  if (!isOwner && !hasLeftHistory) {
    throw ApiError.forbidden('You are not authorized to rejoin this workspace without an invite');
  }

  // Remove from leftMembers history if present
  if (workspace.leftMembers) {
    workspace.leftMembers = workspace.leftMembers.filter(id => id.toString() !== userId.toString());
  }

  // Add back as member
  workspace.members.push({ user: userId, role: 'member' });
  await workspace.save();

  return workspace;
};

module.exports = { 
  createWorkspace, 
  getWorkspaces, 
  getWorkspaceSummaries, 
  getMembers, 
  changeRole,
  updateWorkspace,
  deleteWorkspace,
  restoreWorkspace,
  leaveWorkspace,
  transferOwnership,
  rejoinWorkspace
};
