import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { salesApi } from '../../api/sales.api';
import { getErrorMessage } from '../../api/client';

export const fetchSales = createAsyncThunk('sales/fetchAll', async (params = {}, { rejectWithValue }) => {
  try {
    const res = await salesApi.getAll(params);
    return res.data.data || res.data;
  } catch (e) { return rejectWithValue(getErrorMessage(e)); }
});

export const fetchSaleById = createAsyncThunk('sales/fetchById', async (id, { rejectWithValue }) => {
  try {
    const res = await salesApi.getById(id);
    return res.data.data || res.data;
  } catch (e) { return rejectWithValue(getErrorMessage(e)); }
});

export const createSale = createAsyncThunk('sales/create', async (data, { rejectWithValue }) => {
  try {
    const res = await salesApi.create(data);
    return res.data.data || res.data;
  } catch (e) { return rejectWithValue(getErrorMessage(e)); }
});

export const fetchDailySales = createAsyncThunk('sales/fetchDaily', async (params = {}, { rejectWithValue }) => {
  try {
    const res = await salesApi.getDaily(params);
    return res.data.data || res.data;
  } catch (e) { return rejectWithValue(getErrorMessage(e)); }
});

export const fetchMonthlySales = createAsyncThunk('sales/fetchMonthly', async (params = {}, { rejectWithValue }) => {
  try {
    const res = await salesApi.getMonthly(params);
    return res.data.data || res.data;
  } catch (e) { return rejectWithValue(getErrorMessage(e)); }
});

const salesSlice = createSlice({
  name: 'sales',
  initialState: {
    items: [],
    selected: null,
    dailySales: [],
    monthlySales: [],
    loading: false,
    error: null,
  },
  reducers: {
    setSelected: (s, { payload }) => { s.selected = payload; },
    clearSelected: (s) => { s.selected = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSales.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchSales.fulfilled, (s, { payload }) => {
        s.loading = false;
        s.items = Array.isArray(payload) ? payload : payload?.sales || [];
      })
      .addCase(fetchSales.rejected, (s, { payload }) => { s.loading = false; s.error = payload; })
      .addCase(fetchSaleById.fulfilled, (s, { payload }) => { s.selected = payload?.sale || payload; })
      .addCase(createSale.fulfilled, (s, { payload }) => { s.items.unshift(payload?.sale || payload); })
      .addCase(fetchDailySales.fulfilled, (s, { payload }) => {
        s.dailySales = Array.isArray(payload) ? payload : payload?.sales || [];
      })
      .addCase(fetchMonthlySales.fulfilled, (s, { payload }) => {
        s.monthlySales = Array.isArray(payload) ? payload : payload?.sales || [];
      });
  },
});

export const { setSelected, clearSelected } = salesSlice.actions;
export const selectSales = (s) => s.sales.items;
export const selectSaleSelected = (s) => s.sales.selected;
export const selectSalesLoading = (s) => s.sales.loading;
export const selectDailySales = (s) => s.sales.dailySales;
export const selectMonthlySales = (s) => s.sales.monthlySales;
export default salesSlice.reducer;
