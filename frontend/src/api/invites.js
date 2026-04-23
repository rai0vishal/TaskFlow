import api from './axios';

export const sendInvite = (data) => api.post('/invites/send', data);
export const getPendingInvites = () => api.get('/invites/pending');
export const acceptInvite = (data) => api.post('/invites/accept', data);
export const rejectInvite = (data) => api.post('/invites/reject', data);
