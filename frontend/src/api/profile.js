import axios from './axios';

export const getUserProfile = (userId) => {
  return axios.get(`/profile/${userId}/activity`);
};
