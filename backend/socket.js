const socketIo = require('socket.io');
const logger = require('./utils/logger');
const Message = require('./models/Message');
const Conversation = require('./models/Conversation');
let io;

// Track online users mapping: socket.id -> userId
const onlineUsers = new Map();

module.exports = {
  init: (httpServer, corsOrigins) => {
    io = socketIo(httpServer, {
      cors: {
        origin: corsOrigins,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
      }
    });

    io.on('connection', (socket) => {
      logger.info(`Socket connected: ${socket.id}`);

      // Handle joining board rooms
      socket.on('joinBoard', (boardId) => {
        socket.join(`board_${boardId}`);
        logger.info(`Socket ${socket.id} joined board_${boardId}`);
      });

      // Handle leaving board rooms
      socket.on('leaveBoard', (boardId) => {
        socket.leave(`board_${boardId}`);
        logger.info(`Socket ${socket.id} left board_${boardId}`);
      });

      // Handle joining chat rooms for 1-to-1 conversations
      socket.on('joinChat', (conversationId) => {
        socket.join(`chat_${conversationId}`);
        logger.info(`Socket ${socket.id} joined chat_${conversationId}`);
      });

      // Handle receiving and sending a direct message
      socket.on('sendMessage', async (data) => {
        try {
          const { conversationId, senderId, content } = data;
          
          // Save to database
          const message = await Message.create({
            conversationId,
            sender: senderId,
            content,
          });

          // Populate the sender so frontend can display name
          const populatedMessage = await message.populate('sender', 'name email');

          // Update latest message pointer in Conversation
          await Conversation.findByIdAndUpdate(conversationId, {
            lastMessage: message._id,
          });

          // Broadcast to the specific 1-to-1 room
          io.to(`chat_${conversationId}`).emit('newMessage', populatedMessage);
        } catch (error) {
          logger.error('Error handling sendMessage socket event:', error);
        }
      });

      // Handle generic user namespace for global updates
      socket.on('joinUserRoom', (userId) => {
        socket.join(`user_${userId}`);
        onlineUsers.set(socket.id, userId);
        logger.info(`Socket ${socket.id} joined user_${userId}`);
        
        // Broadcast to everyone that this user is online
        io.emit('userOnline', userId);
        
        // Send the current list of online users to the newly connected user
        const onlineArray = Array.from(new Set(onlineUsers.values()));
        socket.emit('onlineUsers', onlineArray);
      });

      socket.on('disconnect', () => {
        logger.info(`Socket disconnected: ${socket.id}`);
        const userId = onlineUsers.get(socket.id);
        if (userId) {
          onlineUsers.delete(socket.id);
          // Check if user is still connected via other tabs/devices
          const hasOtherTabs = Array.from(onlineUsers.values()).includes(userId);
          if (!hasOtherTabs) {
            io.emit('userOffline', userId);
          }
        }
      });
    });

    return io;
  },
  getIO: () => {
    if (!io) throw new Error('Socket.io is not initialized!');
    return io;
  }
};
