import api from './axios';

export const getTasks = (params = {}) => {
  const { workspace, ...rest } = params;
  if (!workspace) return api.get('/tasks', { params: rest }); // Fallback or fail gracefully
  return api.get(`/tasks/workspace/${workspace}`, { params: rest });
};
export const getTask = (id) => api.get(`/tasks/${id}`);
export const createTask = (data) => api.post('/tasks', data);
export const updateTask = (id, data) => api.put(`/tasks/${id}`, data);
export const deleteTask = (id) => api.delete(`/tasks/${id}`);
export const getTaskActivity = (id) => api.get(`/tasks/${id}/activity`);
export const assignTask = (data) => api.patch('/tasks/assign', data);
