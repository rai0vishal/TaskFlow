const router = require('express').Router();
const inviteController = require('../controllers/invite.controller');
const { authenticate } = require('../middleware/auth');
const { verifyWorkspaceAccess } = require('../middleware/workspaceAuth');
const validate = require('../middleware/validate');
const { sendInviteSchema, inviteActionSchema } = require('../validations/invite.validation');

router.use(authenticate);

// send invite requires admin access on the workspace
router.post('/send', verifyWorkspaceAccess(true), validate(sendInviteSchema), inviteController.sendInvite);

router.get('/pending', inviteController.getPendingInvites);
router.post('/accept', validate(inviteActionSchema), inviteController.acceptInvite);
router.post('/reject', validate(inviteActionSchema), inviteController.rejectInvite);

module.exports = router;
