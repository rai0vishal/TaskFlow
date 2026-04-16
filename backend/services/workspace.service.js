const Workspace = require('../models/Workspace');
const ApiError = require('../utils/ApiError');

const createWorkspace = async (data, userId) => {
  return await Workspace.create({ ...data, owner: userId, members: [userId] });
};

const getWorkspaces = async (user) => {
  const filter = user.role === 'admin' ? {} : { members: user._id };
  return await Workspace.find(filter).populate('owner', 'name email').sort({ createdAt: -1 });
};

module.exports = { createWorkspace, getWorkspaces };
