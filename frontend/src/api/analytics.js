import axios from './axios';

export const getDashboardData = () => {
  return axios.get('/analytics/dashboard');
};
