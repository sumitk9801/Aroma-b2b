import apiClient from './client';

export const stockMovementsApi = {
  getAll: (params = {}) =>
    apiClient.get('/stock-movements', { params }),

  getReceivings: (params = {}) =>
    apiClient.get('/stock-movements', { params: { ...params, referenceType: 'receiving' } }),

  adjust: (data) =>
    apiClient.post('/stock-movements/adjust', data),

  receive: (data) =>
    apiClient.post('/stock-movements/receive', data),
};
