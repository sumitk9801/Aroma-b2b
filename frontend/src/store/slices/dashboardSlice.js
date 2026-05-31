import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { dashboardApi } from '../../api/dashboard.api';
import { getErrorMessage } from '../../api/client';

export const fetchDashboardSummary = createAsyncThunk('dashboard/fetchSummary', async (params = {}, { rejectWithValue }) => {
  try {
    const res = await dashboardApi.getSummary(params);
    return res.data.data || res.data;
  } catch (e) { return rejectWithValue(getErrorMessage(e)); }
});

export const fetchRecentSales = createAsyncThunk('dashboard/fetchRecentSales', async (params = {}, { rejectWithValue }) => {
  try {
    const res = await dashboardApi.getRecentSales({ limit: 8, ...params });
    return res.data.data || res.data;
  } catch (e) { return rejectWithValue(getErrorMessage(e)); }
});

export const fetchTopProducts = createAsyncThunk('dashboard/fetchTopProducts', async (params = {}, { rejectWithValue }) => {
  try {
    const res = await dashboardApi.getTopProducts({ limit: 5, ...params });
    return res.data.data || res.data;
  } catch (e) { return rejectWithValue(getErrorMessage(e)); }
});

export const fetchDashboardLowStock = createAsyncThunk('dashboard/fetchLowStock', async (params = {}, { rejectWithValue }) => {
  try {
    const res = await dashboardApi.getLowStock(params);
    return res.data.data || res.data;
  } catch (e) { return rejectWithValue(getErrorMessage(e)); }
});

export const fetchSalesChart = createAsyncThunk('dashboard/fetchSalesChart', async (params = {}, { rejectWithValue }) => {
  try {
    const res = await dashboardApi.getSalesChart(params);
    return res.data.data || res.data;
  } catch (e) { return rejectWithValue(getErrorMessage(e)); }
});

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: {
    summary: null,
    recentSales: [],
    topProducts: [],
    lowStock: [],
    salesChart: { last7Days: [], last30Days: [] },
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardSummary.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchDashboardSummary.fulfilled, (s, { payload }) => {
        s.loading = false;
        s.summary = payload?.summary || payload;
      })
      .addCase(fetchDashboardSummary.rejected, (s, { payload }) => { s.loading = false; s.error = payload; })
      .addCase(fetchRecentSales.fulfilled, (s, { payload }) => {
        s.recentSales = Array.isArray(payload) ? payload : payload?.sales || [];
      })
      .addCase(fetchTopProducts.fulfilled, (s, { payload }) => {
        s.topProducts = Array.isArray(payload) ? payload : payload?.products || [];
      })
      .addCase(fetchDashboardLowStock.fulfilled, (s, { payload }) => {
        s.lowStock = Array.isArray(payload) ? payload : payload?.products || [];
      })
      .addCase(fetchSalesChart.fulfilled, (s, { payload }) => {
        s.salesChart = payload?.chartData || payload || { last7Days: [], last30Days: [] };
      });
  },
});

export const selectDashboardSummary = (s) => s.dashboard.summary;
export const selectDashboardRecentSales = (s) => s.dashboard.recentSales;
export const selectDashboardTopProducts = (s) => s.dashboard.topProducts;
export const selectDashboardLowStock = (s) => s.dashboard.lowStock;
export const selectDashboardSalesChart = (s) => s.dashboard.salesChart;
export const selectDashboardLoading = (s) => s.dashboard.loading;
export default dashboardSlice.reducer;
