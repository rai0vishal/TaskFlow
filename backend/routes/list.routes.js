const router = require('express').Router();
const listController = require('../controllers/list.controller');
const { authenticate } = require('../middleware/auth');
const { verifyWorkspaceAccess } = require('../middleware/workspaceAuth');
const validate = require('../middleware/validate');
const { createListSchema } = require('../validations/list.validation');
const Board = require('../models/Board');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

router.use(authenticate);

// Helper middleware to verify workspace access through the list's parent board
const verifyWorkspaceFromBoard = asyncHandler(async (req, res, next) => {
  const boardId = req.params.boardId || req.body.board;
  if (!boardId) {
    return next(ApiError.badRequest('Board ID is required'));
  }
  const board = await Board.findById(boardId);
  if (!board) {
    return next(ApiError.notFound('Board not found'));
  }
  // Set workspaceId for verifyWorkspaceAccess middleware
  req.body.workspaceId = board.workspace.toString();
  next();
});

router.post(
  '/',
  validate(createListSchema),
  verifyWorkspaceFromBoard,
  verifyWorkspaceAccess(false),
  listController.createList
);

router.get(
  '/:boardId',
  verifyWorkspaceFromBoard,
  verifyWorkspaceAccess(false),
  listController.getListsByBoard
);

module.exports = router;
