import apiClient from './client';

export const productsApi = {
  getAll: (params = {}) =>
    apiClient.get('/products', { params }),

  getById: (id) =>
    apiClient.get(`/products/${id}`),

  getLowStock: () =>
    apiClient.get('/products/low-stock'),

  create: (data) =>
    apiClient.post('/products', data),

  update: (id, data) =>
    apiClient.patch(`/products/${id}`, data),

  delete: (id) =>
    apiClient.delete(`/products/${id}`),
};
