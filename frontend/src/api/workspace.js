import api from './axios';

export const createWorkspace = (data) => api.post('/workspaces/create', data);
export const getWorkspaces = () => api.get('/workspaces');
export const getWorkspaceSummaries = () => api.get('/workspaces/summaries');
export const inviteMember = (data) => api.post('/workspaces/invite', data);
export const getMembers = (id) => api.get(`/workspaces/${id}/members`);
export const changeRole = (data) => api.patch('/workspaces/role', data);

export const updateWorkspace = (id, data) => api.patch(`/workspaces/${id}`, data);
export const deleteWorkspace = (id) => api.delete(`/workspaces/${id}`);
export const restoreWorkspace = (id) => api.post(`/workspaces/${id}/restore`);
export const leaveWorkspace = (id) => api.post(`/workspaces/${id}/leave`);
export const rejoinWorkspace = (id) => api.post(`/workspaces/${id}/rejoin`);
export const transferOwnership = (id, data) => api.post(`/workspaces/${id}/transfer-ownership`, data);
