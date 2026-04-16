const router = require('express').Router();
const workspaceController = require('../controllers/workspace.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.post('/', workspaceController.createWorkspace);
router.get('/', workspaceController.getWorkspaces);

module.exports = router;
