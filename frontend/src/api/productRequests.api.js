import apiClient from './client';

export const productRequestsApi = {
  getAll: (params = {}) =>
    apiClient.get('/product-requests', { params }),

  getById: (id) =>
    apiClient.get(`/product-requests/${id}`),

  getPendingCount: () =>
    apiClient.get('/product-requests/pending-count'),

  create: (data) =>
    apiClient.post('/product-requests', data),

  approve: (id, data) =>
    apiClient.patch(`/product-requests/${id}/approve`, data),

  reject: (id, data) =>
    apiClient.patch(`/product-requests/${id}/reject`, data),
};
