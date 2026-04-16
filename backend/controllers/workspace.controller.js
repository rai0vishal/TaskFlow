const asyncHandler = require('../utils/asyncHandler');
const sendResponse = require('../utils/sendResponse');
const workspaceService = require('../services/workspace.service');

const createWorkspace = asyncHandler(async (req, res) => {
  const workspace = await workspaceService.createWorkspace(req.body, req.user._id);
  sendResponse(res, 201, 'Workspace created successfully', { workspace });
});

const getWorkspaces = asyncHandler(async (req, res) => {
  const workspaces = await workspaceService.getWorkspaces(req.user);
  sendResponse(res, 200, 'Workspaces retrieved successfully', { workspaces });
});

module.exports = { createWorkspace, getWorkspaces };
