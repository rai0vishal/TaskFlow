const asyncHandler = require('../utils/asyncHandler');
const sendResponse = require('../utils/sendResponse');
const ApiError = require('../utils/ApiError');
const Workspace = require('../models/Workspace');
const Message = require('../models/Message');

/**
 * @route   POST /api/v1/chat/send
 * @desc    Send a message to a workspace
 * @access  Private
 */
const sendMessage = asyncHandler(async (req, res) => {
  const { workspaceId, text } = req.body;

  if (!workspaceId || !text) {
    throw ApiError.badRequest('workspaceId and text are required');
  }

  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) throw ApiError.notFound('Workspace not found');

  const isMember = workspace.members.some((m) => m.user.toString() === req.user._id.toString());
  if (!isMember) {
    throw ApiError.forbidden('You are not a member of this workspace');
  }

  const message = await Message.create({
    workspace: workspaceId,
    sender: req.user._id,
    text,
    seenBy: [req.user._id]
  });

  const populatedMessage = await message.populate('sender', 'name email');

  // Emit real-time socket event so other members in the workspace see the message instantly
  const socketModule = require('../socket');
  const io = socketModule.getIO();
  if (io) {
    io.to(`workspace_${workspaceId}`).emit("new_message", populatedMessage);
  }

  sendResponse(res, 201, 'Message sent successfully', populatedMessage);
});

/**
 * @route   GET /api/v1/chat/:workspaceId
 * @desc    Get all messages for a specific workspace
 * @access  Private
 */
const getMessages = asyncHandler(async (req, res) => {
  const { workspaceId } = req.params;
  const limit = parseInt(req.query.limit, 10) || 50;

  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) throw ApiError.notFound('Workspace not found');

  const isMember = workspace.members.some((m) => m.user.toString() === req.user._id.toString());
  if (!isMember) {
    throw ApiError.forbidden('You are not a member of this workspace');
  }

  const messages = await Message.find({ workspace: workspaceId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('sender', 'name email')
    .lean();

  messages.reverse();

  sendResponse(res, 200, 'Messages fetched successfully', messages);
});

/**
 * @route   PATCH /api/v1/chat/seen
 * @desc    Mark a message as seen
 * @access  Private
 */
const markAsSeen = asyncHandler(async (req, res) => {
  const { messageId } = req.body;

  if (!messageId) {
    throw ApiError.badRequest('messageId is required');
  }

  const message = await Message.findById(messageId);
  if (!message) throw ApiError.notFound('Message not found');

  const workspace = await Workspace.findById(message.workspace);
  const isMember = workspace.members.some((m) => m.user.toString() === req.user._id.toString());
  if (!isMember) throw ApiError.forbidden('You are not a member of this workspace');

  if (!message.seenBy.includes(req.user._id)) {
    message.seenBy.push(req.user._id);
    await message.save();
  }

  sendResponse(res, 200, 'Message marked as seen', message);
});

module.exports = {
  sendMessage,
  getMessages,
  markAsSeen
};
