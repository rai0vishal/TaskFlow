import api from './axios';

export const sendWorkspaceMessage = (data) => api.post('/chat/send', data);
export const getWorkspaceMessages = (workspaceId, params) => api.get(`/chat/${workspaceId}`, { params });
export const markMessageSeen = (messageId) => api.patch('/chat/seen', { messageId });
