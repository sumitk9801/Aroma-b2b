import apiClient from './client';

export const dashboardApi = {
  getSummary: (params = {}) =>
    apiClient.get('/dashboard/summary', { params }),

  getRecentSales: (params = {}) =>
    apiClient.get('/dashboard/recent-sales', { params }),

  getTopProducts: (params = {}) =>
    apiClient.get('/dashboard/top-products', { params }),

  getLowStock: (params = {}) =>
    apiClient.get('/dashboard/low-stock', { params }),

  getSalesChart: (params = {}) =>
    apiClient.get('/dashboard/sales-chart', { params }),
};
