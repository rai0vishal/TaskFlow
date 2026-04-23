const router = require('express').Router();
const workspaceController = require('../controllers/workspace.controller');
const { authenticate } = require('../middleware/auth');
const { verifyWorkspaceAccess } = require('../middleware/workspaceAuth');
const validate = require('../middleware/validate');
const {
  createWorkspaceSchema,
  updateWorkspaceSchema,
  inviteMemberSchema,
  changeRoleSchema,
  transferOwnershipSchema,
} = require('../validations/workspace.validation');

router.use(authenticate);

router.post('/create', validate(createWorkspaceSchema), workspaceController.createWorkspace);
router.post('/', validate(createWorkspaceSchema), workspaceController.createWorkspace); // Legacy support
router.get('/', workspaceController.getWorkspaces);
router.get('/summaries', workspaceController.getWorkspaceSummaries);

router.post('/invite', verifyWorkspaceAccess(true), validate(inviteMemberSchema), workspaceController.inviteMember);
router.get('/:id/members', verifyWorkspaceAccess(false), workspaceController.getMembers);
router.patch('/role', verifyWorkspaceAccess(true), validate(changeRoleSchema), workspaceController.changeRole);

router.patch('/:id', verifyWorkspaceAccess(true), validate(updateWorkspaceSchema), workspaceController.updateWorkspace);
router.delete('/:id', verifyWorkspaceAccess(true), workspaceController.deleteWorkspace);
router.post('/:id/restore', workspaceController.restoreWorkspace); // No access verify because it's deleted
router.post('/:id/leave', verifyWorkspaceAccess(false), workspaceController.leaveWorkspace);
router.post('/:id/rejoin', workspaceController.rejoinWorkspace);
router.post('/:id/transfer-ownership', verifyWorkspaceAccess(true), validate(transferOwnershipSchema), workspaceController.transferOwnership);

module.exports = router;
