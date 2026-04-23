const Workspace = require('../models/Workspace');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const verifyWorkspaceAccess = (requireAdmin = false) => {
  return asyncHandler(async (req, res, next) => {
    // Determine workspaceId based on route params or body
    const workspaceId = req.body.workspaceId || req.params.id || req.params.workspaceId;
    
    if (!workspaceId) {
      return next(ApiError.badRequest('Workspace ID is required'));
    }

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return next(ApiError.notFound('Workspace not found'));
    }

    if (workspace.isDeleted) {
      return next(ApiError.forbidden('This workspace has been deleted and is pending permanent removal'));
    }

    const member = workspace.members.find(
      (m) => m.user.toString() === req.user._id.toString()
    );

    if (!member) {
      return next(ApiError.forbidden('You do not belong to this workspace'));
    }

    if (requireAdmin && member.role !== 'admin') {
      return next(ApiError.forbidden('Only workspace admins can perform this action'));
    }

    // Attach workspace for later use if needed
    req.workspace = workspace;
    next();
  });
};

module.exports = { verifyWorkspaceAccess };
