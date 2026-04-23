const socketIo = require('socket.io');
const logger = require('./utils/logger');
const Message = require('./models/Message');

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

      // General user joining
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

      // Handle Workspace specific joining
      socket.on('joinWorkspace', (workspaceId) => {
        socket.join(`workspace_${workspaceId}`);
        logger.info(`Socket ${socket.id} joined workspace_${workspaceId}`);
      });

      socket.on('leaveWorkspace', (workspaceId) => {
        socket.leave(`workspace_${workspaceId}`);
        logger.info(`Socket ${socket.id} left workspace_${workspaceId}`);
      });

      // Chat Events
      socket.on('send_message', async (data) => {
        try {
          const { workspaceId, senderId, text } = data;
          
          if (!workspaceId || !senderId || !text) return;

          const message = await Message.create({
            workspace: workspaceId,
            sender: senderId,
            text,
            seenBy: [senderId]
          });

          const popMessage = await Message.findById(message._id).populate('sender', 'name email');
          
          // Emit to the workspace room for real-time chat updates
          io.to(`workspace_${workspaceId}`).emit('new_message', popMessage);

          // Find workspace members and increment their unread counter if they aren't the sender
          const Workspace = require('./models/Workspace');
          const workspace = await Workspace.findById(workspaceId);
          if (workspace) {
            workspace.members.forEach((member) => {
              if (member.user.toString() !== senderId.toString()) {
                io.to(`user_${member.user.toString()}`).emit('unread_message_increment', workspaceId);
              }
            });
          }
        } catch (error) {
          logger.error('Error handling send_message socket event:', error);
        }
      });

      socket.on('typing', ({ workspaceId, userName }) => {
        socket.to(`workspace_${workspaceId}`).emit('user_typing', userName);
      });

      socket.on('stop_typing', ({ workspaceId }) => {
        socket.to(`workspace_${workspaceId}`).emit('user_stop_typing');
      });

      socket.on('message_seen', async ({ workspaceId, messageId, userId }) => {
        try {
          const message = await Message.findById(messageId);
          if (message && !message.seenBy.includes(userId)) {
            message.seenBy.push(userId);
            await message.save();
            io.to(`workspace_${workspaceId}`).emit('message_updated', message);
          }
        } catch(error) {
          logger.error('Error in message_seen', error);
        }
      });

      socket.on('disconnect', () => {
        logger.info(`Socket disconnected: ${socket.id}`);
        const userId = onlineUsers.get(socket.id);
        if (userId) {
          onlineUsers.delete(socket.id);
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
  },
  getOnlineUsers: () => {
    return Array.from(new Set(onlineUsers.values()));
  }
};
