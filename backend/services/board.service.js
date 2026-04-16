const Board = require('../models/Board');

const createBoard = async (data) => {
  return await Board.create(data);
};

const getBoardsByWorkspace = async (workspaceId) => {
  return await Board.find({ workspace: workspaceId }).sort({ createdAt: -1 });
};

module.exports = { createBoard, getBoardsByWorkspace };
