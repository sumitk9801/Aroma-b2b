import apiClient from './client';

export const shopsApi = {
  getAll: (params = {}) =>
    apiClient.get('/shops', { params }),

  getById: (id) =>
    apiClient.get(`/shops/${id}`),

  create: (data) =>
    apiClient.post('/shops', data),

  update: (id, data) =>
    apiClient.patch(`/shops/${id}`, data),

  delete: (id) =>
    apiClient.delete(`/shops/${id}`),
};
