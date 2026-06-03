import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { stockMovementsApi } from '../../api/stockMovements.api';
import { getErrorMessage } from '../../api/client';

export const fetchStockMovements = createAsyncThunk('stockMovements/fetchAll', async (params = {}, { rejectWithValue }) => {
  try {
    const res = await stockMovementsApi.getAll(params);
    return res.data.data || res.data;
  } catch (e) { return rejectWithValue(getErrorMessage(e)); }
});

export const fetchReceivings = createAsyncThunk('stockMovements/fetchReceivings', async (params = {}, { rejectWithValue }) => {
  try {
    const res = await stockMovementsApi.getReceivings(params);
    const data = res.data.data || res.data;
    return Array.isArray(data) ? data : data?.movements || [];
  } catch (e) { return rejectWithValue(getErrorMessage(e)); }
});

export const adjustStock = createAsyncThunk('stockMovements/adjust', async (data, { rejectWithValue }) => {
  try {
    const res = await stockMovementsApi.adjust(data);
    return res.data.data || res.data;
  } catch (e) { return rejectWithValue(getErrorMessage(e)); }
});

export const receiveStock = createAsyncThunk('stockMovements/receive', async (data, { rejectWithValue }) => {
  try {
    const res = await stockMovementsApi.receive(data);
    return res.data.data || res.data;
  } catch (e) { return rejectWithValue(getErrorMessage(e)); }
});

const stockMovementsSlice = createSlice({
  name: 'stockMovements',
  initialState: { items: [], receivings: [], loading: false, receivingsLoading: false, error: null, adjustResult: null, receiveResult: null },
  reducers: {
    clearAdjustResult: (s) => { s.adjustResult = null; },
    clearReceiveResult: (s) => { s.receiveResult = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStockMovements.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchStockMovements.fulfilled, (s, { payload }) => {
        s.loading = false;
        s.items = Array.isArray(payload) ? payload : payload?.movements || [];
      })
      .addCase(fetchStockMovements.rejected, (s, { payload }) => { s.loading = false; s.error = payload; })
      .addCase(fetchReceivings.pending, (s) => { s.receivingsLoading = true; })
      .addCase(fetchReceivings.fulfilled, (s, { payload }) => {
        s.receivingsLoading = false;
        s.receivings = payload;
      })
      .addCase(fetchReceivings.rejected, (s) => { s.receivingsLoading = false; })
      .addCase(adjustStock.fulfilled, (s, { payload }) => { s.adjustResult = payload; })
      .addCase(receiveStock.fulfilled, (s, { payload }) => {
        s.receiveResult = payload;
        // Prepend new movements to items list
        if (Array.isArray(payload)) {
          s.receivings = [...payload, ...s.receivings];
        }
      });
  },
});

export const { clearAdjustResult, clearReceiveResult } = stockMovementsSlice.actions;
export const selectStockMovements = (s) => s.stockMovements.items;
export const selectReceivings = (s) => s.stockMovements.receivings;
export const selectStockMovementsLoading = (s) => s.stockMovements.loading;
export const selectReceivingsLoading = (s) => s.stockMovements.receivingsLoading;
export const selectAdjustResult = (s) => s.stockMovements.adjustResult;
export const selectReceiveResult = (s) => s.stockMovements.receiveResult;
export default stockMovementsSlice.reducer;
