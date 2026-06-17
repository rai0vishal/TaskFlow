const router = require('express').Router();
const boardController = require('../controllers/board.controller');
const { authenticate } = require('../middleware/auth');
const { verifyWorkspaceAccess } = require('../middleware/workspaceAuth');
const validate = require('../middleware/validate');
const { createBoardSchema } = require('../validations/board.validation');

router.use(authenticate);

router.post(
  '/',
  validate(createBoardSchema),
  verifyWorkspaceAccess(false),
  (req, res, next) => {
    // Map workspaceId from validation body to workspace field required by Board schema
    req.body.workspace = req.body.workspaceId;
    next();
  },
  boardController.createBoard
);

router.get('/:workspaceId', verifyWorkspaceAccess(false), boardController.getBoardsByWorkspace);

module.exports = router;
