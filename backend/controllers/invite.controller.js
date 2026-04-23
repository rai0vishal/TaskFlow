const Invite = require('../models/Invite');
const User = require('../models/User');
const Workspace = require('../models/Workspace');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const sendResponse = require('../utils/sendResponse');

exports.sendInvite = asyncHandler(async (req, res, next) => {
  const { workspaceId, receiverEmail, message } = req.body;
  
  if (!workspaceId || !receiverEmail) {
    return next(ApiError.badRequest('Workspace ID and receiver email are required'));
  }

  // Find user by email
  const receiver = await User.findOne({ email: receiverEmail });
  if (!receiver) {
    return next(ApiError.notFound('User not found'));
  }

  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) {
    return next(ApiError.notFound('Workspace not found'));
  }

  // Check if user is already a member
  const isMember = workspace.members.some((m) => m.user.toString() === receiver._id.toString());
  if (isMember) {
    return next(ApiError.badRequest('User is already a member of this workspace'));
  }

  // Prevent duplicate pending invite
  const existingInvite = await Invite.findOne({
    workspace: workspaceId,
    receiver: receiver._id,
    status: 'pending'
  });

  if (existingInvite) {
    return next(ApiError.badRequest('A pending invite already exists for this user in this workspace'));
  }

  const invite = await Invite.create({
    workspace: workspaceId,
    sender: req.user._id,
    receiver: receiver._id,
    message: message || ''
  });

  sendResponse(res, 201, 'Invite sent successfully', { invite });
});

exports.getPendingInvites = asyncHandler(async (req, res) => {
  const invites = await Invite.find({
    receiver: req.user._id,
    status: 'pending'
  })
  .populate('workspace', 'name')
  .populate('sender', 'name email')
  .sort({ createdAt: -1 });

  sendResponse(res, 200, 'Pending invites retrieved', { invites });
});

exports.acceptInvite = asyncHandler(async (req, res, next) => {
  const { inviteId } = req.body;

  if (!inviteId) {
    return next(ApiError.badRequest('Invite ID is required'));
  }

  const invite = await Invite.findById(inviteId);
  if (!invite) {
    return next(ApiError.notFound('Invite not found'));
  }

  if (invite.receiver.toString() !== req.user._id.toString()) {
    return next(ApiError.forbidden('You can only accept your own invites'));
  }

  if (invite.status !== 'pending') {
    return next(ApiError.badRequest('This invite has already been processed'));
  }

  // Update workspace
  const workspace = await Workspace.findById(invite.workspace);
  if (!workspace) {
    return next(ApiError.notFound('Workspace not found'));
  }

  const isMember = workspace.members.some((m) => m.user.toString() === req.user._id.toString());
  if (!isMember) {
    workspace.members.push({ user: req.user._id, role: 'member' });
    await workspace.save();
  }

  // Update invite status
  invite.status = 'accepted';
  await invite.save();

  sendResponse(res, 200, 'Invite accepted successfully');
});

exports.rejectInvite = asyncHandler(async (req, res, next) => {
  const { inviteId } = req.body;

  if (!inviteId) {
    return next(ApiError.badRequest('Invite ID is required'));
  }

  const invite = await Invite.findById(inviteId);
  if (!invite) {
    return next(ApiError.notFound('Invite not found'));
  }

  if (invite.receiver.toString() !== req.user._id.toString()) {
    return next(ApiError.forbidden('You can only reject your own invites'));
  }

  if (invite.status !== 'pending') {
    return next(ApiError.badRequest('This invite has already been processed'));
  }

  // Update invite status
  invite.status = 'rejected';
  await invite.save();

  sendResponse(res, 200, 'Invite rejected successfully');
});
