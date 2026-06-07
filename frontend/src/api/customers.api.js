import apiClient from './client';

export const customersApi = {
  getAll: (params = {}) => apiClient.get('/customers', { params }),
  getById: (id) => apiClient.get(`/customers/${id}`),
  create: (data) => apiClient.post('/customers', data),
  update: (id, data) => apiClient.put(`/customers/${id}`, data),
  delete: (id) => apiClient.delete(`/customers/${id}`),
  getStats: (params = {}) => apiClient.get('/customers/stats', { params }),
};
