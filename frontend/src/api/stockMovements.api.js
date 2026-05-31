import apiClient from './client';

export const stockMovementsApi = {
  getAll: (params = {}) =>
    apiClient.get('/stock-movements', { params }),

  adjust: (data) =>
    apiClient.post('/stock-movements/adjust', data),
};
