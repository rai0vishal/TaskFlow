const List = require('../models/List');

const createList = async (data) => {
  return await List.create(data);
};

const getListsByBoard = async (boardId) => {
  return await List.find({ board: boardId }).sort({ order: 1, createdAt: 1 });
};

module.exports = { createList, getListsByBoard };
