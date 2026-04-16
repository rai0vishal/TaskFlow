const router = require('express').Router();
const chatController = require('../controllers/chat.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/users/search', chatController.searchUsers);
router.get('/conversations', chatController.getConversations);
router.post('/conversations', chatController.accessConversation);
router.get('/messages/:conversationId', chatController.getMessages);

module.exports = router;
