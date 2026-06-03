import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import productsReducer from './slices/productsSlice';
import salesReducer from './slices/salesSlice';
import purchasesReducer from './slices/purchasesSlice';
import categoriesReducer from './slices/categoriesSlice';
import shopsReducer from './slices/shopsSlice';
import usersReducer from './slices/usersSlice';
import dashboardReducer from './slices/dashboardSlice';
import reportsReducer from './slices/reportsSlice';
import stockMovementsReducer from './slices/stockMovementsSlice';
import uiReducer from './slices/uiSlice';
import productRequestsReducer from './slices/productRequestsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    products: productsReducer,
    sales: salesReducer,
    purchases: purchasesReducer,
    categories: categoriesReducer,
    shops: shopsReducer,
    users: usersReducer,
    dashboard: dashboardReducer,
    reports: reportsReducer,
    stockMovements: stockMovementsReducer,
    ui: uiReducer,
    productRequests: productRequestsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export default store;
