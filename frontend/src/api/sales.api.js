import apiClient from './client';

export const salesApi = {
  getAll: (params = {}) =>
    apiClient.get('/sales', { params }),

  getById: (id) =>
    apiClient.get(`/sales/${id}`),

  create: (data) =>
    apiClient.post('/sales', data),

  getDaily: (params = {}) =>
    apiClient.get('/sales/daily', { params }),

  getMonthly: (params = {}) =>
    apiClient.get('/sales/monthly', { params }),

  getByProduct: (productId) =>
    apiClient.get(`/sales/product/${productId}`),
};
