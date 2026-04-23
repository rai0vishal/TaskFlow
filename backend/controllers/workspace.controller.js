const asyncHandler = require('../utils/asyncHandler');
const sendResponse = require('../utils/sendResponse');
const workspaceService = require('../services/workspace.service');
const { getIO } = require('../socket');

const createWorkspace = asyncHandler(async (req, res) => {
  const workspace = await workspaceService.createWorkspace(req.body, req.user._id);
  sendResponse(res, 201, 'Workspace created successfully', { workspace });
});

const getWorkspaces = asyncHandler(async (req, res) => {
  const workspaces = await workspaceService.getWorkspaces(req.user);
  sendResponse(res, 200, 'Workspaces retrieved successfully', { workspaces });
});

const getWorkspaceSummaries = asyncHandler(async (req, res) => {
  const summaries = await workspaceService.getWorkspaceSummaries(req.user);
  sendResponse(res, 200, 'Workspace summaries retrieved', { workspaces: summaries });
});

const inviteMember = asyncHandler(async (req, res) => {
  const { workspaceId, email } = req.body;
  const workspace = await workspaceService.inviteMember(workspaceId, email);
  
  // Try to find the newly added member to emit
  const newMember = workspace.members.find(m => m.user.email === email);
  if (newMember) {
    getIO().emit('member_added', { workspaceId, member: newMember });
  }

  sendResponse(res, 200, 'Member invited successfully', { workspace });
});

const getMembers = asyncHandler(async (req, res) => {
  const members = await workspaceService.getMembers(req.params.id);
  sendResponse(res, 200, 'Members retrieved successfully', { members });
});

const changeRole = asyncHandler(async (req, res) => {
  const { workspaceId, userId, role } = req.body;
  const member = await workspaceService.changeRole(workspaceId, userId, role);
  
  getIO().emit('role_updated', { workspaceId, userId, role });

  sendResponse(res, 200, 'Role updated successfully', { member });
});

const updateWorkspace = asyncHandler(async (req, res) => {
  const workspace = await workspaceService.updateWorkspace(req.params.id, req.body);
  sendResponse(res, 200, 'Workspace updated successfully', { workspace });
});

const deleteWorkspace = asyncHandler(async (req, res) => {
  const workspace = await workspaceService.deleteWorkspace(req.params.id, req.user._id);
  sendResponse(res, 200, 'Workspace deleted (can be undone)', { workspaceId: workspace._id });
});

const restoreWorkspace = asyncHandler(async (req, res) => {
  const workspace = await workspaceService.restoreWorkspace(req.params.id, req.user._id);
  sendResponse(res, 200, 'Workspace restored successfully', { workspace });
});

const leaveWorkspace = asyncHandler(async (req, res) => {
  await workspaceService.leaveWorkspace(req.params.id, req.user._id);
  sendResponse(res, 200, 'You have left the workspace');
});

const transferOwnership = asyncHandler(async (req, res) => {
  const { newOwnerId } = req.body;
  const workspace = await workspaceService.transferOwnership(req.params.id, req.user._id, newOwnerId);
  sendResponse(res, 200, 'Ownership transferred successfully', { workspace });
});

const rejoinWorkspace = asyncHandler(async (req, res) => {
  const workspace = await workspaceService.rejoinWorkspace(req.params.id, req.user._id);
  sendResponse(res, 200, 'Rejoined workspace successfully', { workspace });
});

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
