const router = require('express').Router();
const chatController = require('../controllers/chat.controller');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { sendMessageSchema, markAsSeenSchema } = require('../validations/chat.validation');

router.use(authenticate);

router.post('/send', validate(sendMessageSchema), chatController.sendMessage);
router.get('/:workspaceId', chatController.getMessages);
router.patch('/seen', validate(markAsSeenSchema), chatController.markAsSeen);

module.exports = router;
