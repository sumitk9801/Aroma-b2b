import apiClient from './client';

export const usersApi = {
  getAll: (params = {}) =>
    apiClient.get('/users', { params }),

  getById: (id) =>
    apiClient.get(`/users/${id}`),

  create: (data) =>
    apiClient.post('/users', data),

  update: (id, data) =>
    apiClient.patch(`/users/${id}`, data),

  delete: (id) =>
    apiClient.delete(`/users/${id}`),
};
