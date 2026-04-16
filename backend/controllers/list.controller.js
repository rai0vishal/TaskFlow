const asyncHandler = require('../utils/asyncHandler');
const sendResponse = require('../utils/sendResponse');
const listService = require('../services/list.service');

const createList = asyncHandler(async (req, res) => {
  const list = await listService.createList(req.body);
  sendResponse(res, 201, 'List created successfully', { list });
});

const getListsByBoard = asyncHandler(async (req, res) => {
  const lists = await listService.getListsByBoard(req.params.boardId);
  sendResponse(res, 200, 'Lists retrieved successfully', { lists });
});

module.exports = { createList, getListsByBoard };
