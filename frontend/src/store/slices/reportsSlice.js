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

const reportsSlice = createSlice({
  name: 'reports',
  initialState: {
    salesSummary: null, purchaseSummary: null, profitSummary: null,
    stockValuation: null, deadStock: [], fastMoving: [],
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
      });
  },
});

export const selectReports = (s) => s.reports;
export const selectReportsLoading = (s) => s.reports.loading;
export default reportsSlice.reducer;
