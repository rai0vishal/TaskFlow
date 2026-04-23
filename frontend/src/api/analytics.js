import axios from './axios';

export const getDashboardData = (workspaceId) => {
  return axios.get('/analytics/dashboard', {
    params: { workspaceId },
  });
};

export const getUserAnalytics = (userId, workspaceId, params = {}) => {
  return axios.get(`/analytics/user/${userId}`, {
    params: { workspaceId, ...params }
  });
};
