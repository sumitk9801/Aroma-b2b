import apiClient from './client';

export const reportsApi = {
  getSalesSummary: (params = {}) =>
    apiClient.get('/reports/sales-summary', { params }),

  getPurchaseSummary: (params = {}) =>
    apiClient.get('/reports/purchase-summary', { params }),

  getProfitSummary: (params = {}) =>
    apiClient.get('/reports/profit-summary', { params }),

  getStockValuation: (params = {}) =>
    apiClient.get('/reports/stock-valuation', { params }),

  getDeadStock: (params = {}) =>
    apiClient.get('/reports/dead-stock', { params }),

  getFastMovingProducts: (params = {}) =>
    apiClient.get('/reports/fast-moving-products', { params }),
};
