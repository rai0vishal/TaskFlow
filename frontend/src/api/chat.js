import api from './axios';

export const searchUsers = (searchParams) => api.get(`/chat/users/search?search=${searchParams}`);
export const getConversations = () => api.get('/chat/conversations');
export const accessConversation = (userId) => api.post('/chat/conversations', { userId });
export const getMessages = (conversationId) => api.get(`/chat/messages/${conversationId}`);
