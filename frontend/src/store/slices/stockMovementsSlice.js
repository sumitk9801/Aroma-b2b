import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { stockMovementsApi } from '../../api/stockMovements.api';
import { getErrorMessage } from '../../api/client';

export const fetchStockMovements = createAsyncThunk('stockMovements/fetchAll', async (params = {}, { rejectWithValue }) => {
  try {
    const res = await stockMovementsApi.getAll(params);
    return res.data.data || res.data;
  } catch (e) { return rejectWithValue(getErrorMessage(e)); }
});

export const adjustStock = createAsyncThunk('stockMovements/adjust', async (data, { rejectWithValue }) => {
  try {
    const res = await stockMovementsApi.adjust(data);
    return res.data.data || res.data;
  } catch (e) { return rejectWithValue(getErrorMessage(e)); }
});

const stockMovementsSlice = createSlice({
  name: 'stockMovements',
  initialState: { items: [], loading: false, error: null, adjustResult: null },
  reducers: {
    clearAdjustResult: (s) => { s.adjustResult = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStockMovements.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchStockMovements.fulfilled, (s, { payload }) => {
        s.loading = false;
        s.items = Array.isArray(payload) ? payload : payload?.movements || [];
      })
      .addCase(fetchStockMovements.rejected, (s, { payload }) => { s.loading = false; s.error = payload; })
      .addCase(adjustStock.fulfilled, (s, { payload }) => { s.adjustResult = payload; });
  },
});

export const { clearAdjustResult } = stockMovementsSlice.actions;
export const selectStockMovements = (s) => s.stockMovements.items;
export const selectStockMovementsLoading = (s) => s.stockMovements.loading;
export const selectAdjustResult = (s) => s.stockMovements.adjustResult;
export default stockMovementsSlice.reducer;
