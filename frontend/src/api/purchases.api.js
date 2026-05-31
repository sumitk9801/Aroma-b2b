import apiClient from './client';

export const purchasesApi = {
  getAll: (params = {}) =>
    apiClient.get('/purchases', { params }),

  getById: (id) =>
    apiClient.get(`/purchases/${id}`),

  create: (data) =>
    apiClient.post('/purchases', data),

  getByProduct: (productId) =>
    apiClient.get(`/purchases/product/${productId}`),
};
