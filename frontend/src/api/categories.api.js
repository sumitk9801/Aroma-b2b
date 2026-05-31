import apiClient from './client';

export const categoriesApi = {
  getAll: (params = {}) =>
    apiClient.get('/categories', { params }),

  getById: (id) =>
    apiClient.get(`/categories/${id}`),

  create: (data) =>
    apiClient.post('/categories', data),

  update: (id, data) =>
    apiClient.patch(`/categories/${id}`, data),

  delete: (id) =>
    apiClient.delete(`/categories/${id}`),
};
