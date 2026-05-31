import apiClient from './client';

export const authApi = {
  login: (credentials) =>
    apiClient.post('/auth/login', credentials),

  register: (userData) =>
    apiClient.post('/auth/register', userData),

  logout: (data) =>
    apiClient.post('/auth/logout', data),

  getMe: () =>
    apiClient.get('/auth/me'),

  refreshToken: (refreshToken) =>
    apiClient.post('/auth/refresh-token', { refreshToken }),
};
