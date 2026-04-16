const asyncHandler = require('../utils/asyncHandler');
const sendResponse = require('../utils/sendResponse');
const boardService = require('../services/board.service');

const createBoard = asyncHandler(async (req, res) => {
  const board = await boardService.createBoard(req.body);
  sendResponse(res, 201, 'Board created successfully', { board });
});

const getBoardsByWorkspace = asyncHandler(async (req, res) => {
  const boards = await boardService.getBoardsByWorkspace(req.params.workspaceId);
  sendResponse(res, 200, 'Boards retrieved successfully', { boards });
});

module.exports = { createBoard, getBoardsByWorkspace };
