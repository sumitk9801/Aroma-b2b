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

  // ─── New endpoints ──────────────────────────────────────────────
  getSalesByDateRange: (params = {}) =>
    apiClient.get('/reports/sales-by-date', { params }),

  getMyTransactions: (params = {}) =>
    apiClient.get('/reports/my-transactions', { params }),

  getProductOrderFrequency: (params = {}) =>
    apiClient.get('/reports/product-order-frequency', { params }),

  getTopCustomers: (params = {}) =>
    apiClient.get('/reports/top-customers', { params }),

  getInventoryTurnover: (params = {}) =>
    apiClient.get('/reports/inventory-turnover', { params }),

  getStockRestoredSummary: (params = {}) =>
    apiClient.get('/reports/stock-restored', { params }),

  getMonthlyComparison: (params = {}) =>
    apiClient.get('/reports/monthly-comparison', { params }),
};
