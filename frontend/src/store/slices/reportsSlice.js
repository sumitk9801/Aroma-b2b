import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { reportsApi } from '../../api/reports.api';
import { getErrorMessage } from '../../api/client';

export const fetchSalesSummary = createAsyncThunk('reports/salesSummary', async (params = {}, { rejectWithValue }) => {
  try { const res = await reportsApi.getSalesSummary(params); return res.data.data || res.data; }
  catch (e) { return rejectWithValue(getErrorMessage(e)); }
});

export const fetchPurchaseSummary = createAsyncThunk('reports/purchaseSummary', async (params = {}, { rejectWithValue }) => {
  try { const res = await reportsApi.getPurchaseSummary(params); return res.data.data || res.data; }
  catch (e) { return rejectWithValue(getErrorMessage(e)); }
});

export const fetchProfitSummary = createAsyncThunk('reports/profitSummary', async (params = {}, { rejectWithValue }) => {
  try { const res = await reportsApi.getProfitSummary(params); return res.data.data || res.data; }
  catch (e) { return rejectWithValue(getErrorMessage(e)); }
});

export const fetchStockValuation = createAsyncThunk('reports/stockValuation', async (params = {}, { rejectWithValue }) => {
  try { const res = await reportsApi.getStockValuation(params); return res.data.data || res.data; }
  catch (e) { return rejectWithValue(getErrorMessage(e)); }
});

export const fetchDeadStock = createAsyncThunk('reports/deadStock', async (params = {}, { rejectWithValue }) => {
  try { const res = await reportsApi.getDeadStock(params); return res.data.data || res.data; }
  catch (e) { return rejectWithValue(getErrorMessage(e)); }
});

export const fetchFastMovingProducts = createAsyncThunk('reports/fastMoving', async (params = {}, { rejectWithValue }) => {
  try { const res = await reportsApi.getFastMovingProducts(params); return res.data.data || res.data; }
  catch (e) { return rejectWithValue(getErrorMessage(e)); }
});

export const fetchSalesByDateRange = createAsyncThunk('reports/salesByDateRange', async (params = {}, { rejectWithValue }) => {
  try { const res = await reportsApi.getSalesByDateRange(params); return res.data.data || res.data; }
  catch (e) { return rejectWithValue(getErrorMessage(e)); }
});

export const fetchMyTransactions = createAsyncThunk('reports/myTransactions', async (params = {}, { rejectWithValue }) => {
  try { const res = await reportsApi.getMyTransactions(params); return res.data.data || res.data; }
  catch (e) { return rejectWithValue(getErrorMessage(e)); }
});

export const fetchProductOrderFrequency = createAsyncThunk('reports/productOrderFrequency', async (params = {}, { rejectWithValue }) => {
  try { const res = await reportsApi.getProductOrderFrequency(params); return res.data.data || res.data; }
  catch (e) { return rejectWithValue(getErrorMessage(e)); }
});

export const fetchTopCustomers = createAsyncThunk('reports/topCustomers', async (params = {}, { rejectWithValue }) => {
  try { const res = await reportsApi.getTopCustomers(params); return res.data.data || res.data; }
  catch (e) { return rejectWithValue(getErrorMessage(e)); }
});

export const fetchInventoryTurnover = createAsyncThunk('reports/inventoryTurnover', async (params = {}, { rejectWithValue }) => {
  try { const res = await reportsApi.getInventoryTurnover(params); return res.data.data || res.data; }
  catch (e) { return rejectWithValue(getErrorMessage(e)); }
});

export const fetchStockRestoredSummary = createAsyncThunk('reports/stockRestored', async (params = {}, { rejectWithValue }) => {
  try { const res = await reportsApi.getStockRestoredSummary(params); return res.data.data || res.data; }
  catch (e) { return rejectWithValue(getErrorMessage(e)); }
});

export const fetchMonthlyComparison = createAsyncThunk('reports/monthlyComparison', async (params = {}, { rejectWithValue }) => {
  try { const res = await reportsApi.getMonthlyComparison(params); return res.data.data || res.data; }
  catch (e) { return rejectWithValue(getErrorMessage(e)); }
});

const reportsSlice = createSlice({
  name: 'reports',
  initialState: {
    salesSummary: null, purchaseSummary: null, profitSummary: null,
    stockValuation: null, deadStock: [], fastMoving: [],
    salesByDateRange: null, myTransactions: null, productOrderFrequency: [],
    topCustomers: [], inventoryTurnover: null, stockRestored: null,
    monthlyComparison: [],
    loading: false, error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    const pending = (s) => { s.loading = true; s.error = null; };
    const rejected = (s, { payload }) => { s.loading = false; s.error = payload; };
    builder
      .addCase(fetchSalesSummary.pending, pending)
      .addCase(fetchSalesSummary.fulfilled, (s, { payload }) => { s.loading = false; s.salesSummary = payload; })
      .addCase(fetchSalesSummary.rejected, rejected)
      .addCase(fetchPurchaseSummary.pending, pending)
      .addCase(fetchPurchaseSummary.fulfilled, (s, { payload }) => { s.loading = false; s.purchaseSummary = payload; })
      .addCase(fetchPurchaseSummary.rejected, rejected)
      .addCase(fetchProfitSummary.pending, pending)
      .addCase(fetchProfitSummary.fulfilled, (s, { payload }) => { s.loading = false; s.profitSummary = payload; })
      .addCase(fetchProfitSummary.rejected, rejected)
      .addCase(fetchStockValuation.fulfilled, (s, { payload }) => { s.stockValuation = payload; })
      .addCase(fetchDeadStock.fulfilled, (s, { payload }) => {
        s.deadStock = Array.isArray(payload) ? payload : payload?.products || [];
      })
      .addCase(fetchFastMovingProducts.fulfilled, (s, { payload }) => {
        s.fastMoving = Array.isArray(payload) ? payload : payload?.products || [];
      })
      .addCase(fetchSalesByDateRange.pending, pending)
      .addCase(fetchSalesByDateRange.fulfilled, (s, { payload }) => { s.loading = false; s.salesByDateRange = payload; })
      .addCase(fetchSalesByDateRange.rejected, rejected)
      .addCase(fetchMyTransactions.pending, pending)
      .addCase(fetchMyTransactions.fulfilled, (s, { payload }) => { s.loading = false; s.myTransactions = payload; })
      .addCase(fetchMyTransactions.rejected, rejected)
      .addCase(fetchProductOrderFrequency.fulfilled, (s, { payload }) => { s.productOrderFrequency = payload; })
      .addCase(fetchTopCustomers.fulfilled, (s, { payload }) => { s.topCustomers = payload; })
      .addCase(fetchInventoryTurnover.fulfilled, (s, { payload }) => { s.inventoryTurnover = payload; })
      .addCase(fetchStockRestoredSummary.fulfilled, (s, { payload }) => { s.stockRestored = payload; })
      .addCase(fetchMonthlyComparison.fulfilled, (s, { payload }) => { s.monthlyComparison = payload; });
  },
});

export const selectReports = (s) => s.reports;
export const selectReportsLoading = (s) => s.reports.loading;
export default reportsSlice.reducer;
