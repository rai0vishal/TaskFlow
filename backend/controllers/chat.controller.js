const asyncHandler = require('../utils/asyncHandler');
const sendResponse = require('../utils/sendResponse');
const ApiError = require('../utils/ApiError');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

/**
 * @route   GET /api/v1/chat/users/search
 * @desc    Search users by name or email to start a conversation
 * @access  Private
 */
const searchUsers = asyncHandler(async (req, res) => {
  const keyword = req.query.search
    ? {
        $or: [
          { name: { $regex: req.query.search, $options: 'i' } },
          { email: { $regex: req.query.search, $options: 'i' } },
        ],
      }
    : {};

  // Exclude current logged in user from search results
  const users = await User.find(keyword).find({ _id: { $ne: req.user._id } }).select('name email');

  sendResponse(res, 200, 'Users searched successfully', users);
});

/**
 * @route   GET /api/v1/chat/conversations
 * @desc    Get all conversations for a user
 * @access  Private
 */
const getConversations = asyncHandler(async (req, res) => {
  const conversations = await Conversation.find({ participants: req.user._id })
    .populate('participants', 'name email')
    .populate('lastMessage')
    .sort({ updatedAt: -1 });

  sendResponse(res, 200, 'Conversations fetched successfully', conversations);
});

/**
 * @route   POST /api/v1/chat/conversations
 * @desc    Access or Create a 1-to-1 conversation
 * @access  Private
 */
const accessConversation = asyncHandler(async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    throw ApiError.badRequest('UserId param not sent with request');
  }

  // Find if conversation exists between these two users
  let isChat = await Conversation.find({
    $and: [
      { participants: { $elemMatch: { $eq: req.user._id } } },
      { participants: { $elemMatch: { $eq: userId } } },
    ],
  })
    .populate('participants', 'name email')
    .populate('lastMessage');

  if (isChat.length > 0) {
    sendResponse(res, 200, 'Conversation fetched', isChat[0]);
  } else {
    // Create new conversation
    var chatData = {
      participants: [req.user._id, userId],
    };

    const createdChat = await Conversation.create(chatData);
    const fullChat = await Conversation.findOne({ _id: createdChat._id }).populate(
      'participants',
      'name email'
    );

    sendResponse(res, 201, 'Conversation created', fullChat);
  }
});

/**
 * @route   GET /api/v1/chat/messages/:conversationId
 * @desc    Get all messages for a specific conversation
 * @access  Private
 */
const getMessages = asyncHandler(async (req, res) => {
  // ensure user is participant
  const conversation = await Conversation.findById(req.params.conversationId);
  if (!conversation) {
    throw ApiError.notFound('Conversation not found');
  }
  
  if (!conversation.participants.includes(req.user._id)) {
      throw ApiError.forbidden('You are not a participant in this conversation');
  }

  const messages = await Message.find({ conversationId: req.params.conversationId })
    .populate('sender', 'name email')
    .sort({ createdAt: 1 });

  sendResponse(res, 200, 'Messages fetched successfully', messages);
});

module.exports = {
  searchUsers,
  getConversations,
  accessConversation,
  getMessages,
};
