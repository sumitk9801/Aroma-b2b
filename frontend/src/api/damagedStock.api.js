import apiClient from './client';

export const damagedStockApi = {
  report: (data) => apiClient.post('/damaged-stock', data),
  getAll: (params = {}) => apiClient.get('/damaged-stock', { params }),
  getSummary: (params = {}) => apiClient.get('/damaged-stock/summary', { params }),
  getByProduct: (productId) => apiClient.get(`/damaged-stock/product/${productId}`),
};
