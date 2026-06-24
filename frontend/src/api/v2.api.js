import apiClientV2 from './clientV2';

export const v2Api = {
  // Forecast
  getShortForecast: () => apiClientV2.get('/forecast/short'),
  getMediumForecast: () => apiClientV2.get('/forecast/medium'),
  getProductForecast: (productId) => apiClientV2.get(`/forecast/product/${productId}`),
  getReorderMetrics: () => apiClientV2.get('/forecast/reorder'),
  getStockRisk: () => apiClientV2.get('/forecast/stock-risk'),

  // Intelligence
  getVelocity: () => apiClientV2.get('/intelligence/velocity'),
  getTurnover: () => apiClientV2.get('/intelligence/turnover'),
  getCapitalRisk: () => apiClientV2.get('/intelligence/capital-risk'),
  getLowStock: () => apiClientV2.get('/intelligence/low-stock'),

  // Recommendations
  getReorderRecs: () => apiClientV2.get('/recommendations/reorder'),
  getPromotionRecs: () => apiClientV2.get('/recommendations/promotion'),
  getOpportunityScores: () => apiClientV2.get('/recommendations/opportunities'),

  // Signals
  getSignalHistory: () => apiClientV2.get('/signals/history'),
  getAdjustedMetrics: () => apiClientV2.get('/signals/adjusted-metrics'),
  getUpcomingEvents: () => apiClientV2.get('/signals/upcoming'),
  getWeatherImpact: () => apiClientV2.get('/signals/weather'),
  getSeasonalInsights: () => apiClientV2.get('/signals/seasonal'),

  // Trends
  getTrendingSummary: () => apiClientV2.get('/trends/summary'),
  getRisingProducts: () => apiClientV2.get('/trends/rising'),
  getDecliningProducts: () => apiClientV2.get('/trends/declining'),
  getOpportunities: () => apiClientV2.get('/trends/opportunities'),
  triggerTrendDetection: () => apiClientV2.post('/trends/trigger'),

  // Assistant
  askQuestion: (question) => apiClientV2.post('/assistant/ask', { question }),
  getSuggestions: () => apiClientV2.get('/assistant/suggestions'),
  getDailyBriefing: () => apiClientV2.get('/assistant/daily-briefing'),
};
