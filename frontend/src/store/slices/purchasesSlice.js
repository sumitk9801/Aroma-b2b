import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { purchasesApi } from '../../api/purchases.api';
import { getErrorMessage } from '../../api/client';

export const fetchPurchases = createAsyncThunk('purchases/fetchAll', async (params = {}, { rejectWithValue }) => {
  try {
    const res = await purchasesApi.getAll(params);
    return res.data.data || res.data;
  } catch (e) { return rejectWithValue(getErrorMessage(e)); }
});

export const fetchPurchaseById = createAsyncThunk('purchases/fetchById', async (id, { rejectWithValue }) => {
  try {
    const res = await purchasesApi.getById(id);
    return res.data.data || res.data;
  } catch (e) { return rejectWithValue(getErrorMessage(e)); }
});

export const createPurchase = createAsyncThunk('purchases/create', async (data, { rejectWithValue }) => {
  try {
    const res = await purchasesApi.create(data);
    return res.data.data || res.data;
  } catch (e) { return rejectWithValue(getErrorMessage(e)); }
});

const purchasesSlice = createSlice({
  name: 'purchases',
  initialState: { items: [], selected: null, loading: false, error: null },
  reducers: {
    setSelected: (s, { payload }) => { s.selected = payload; },
    clearSelected: (s) => { s.selected = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPurchases.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchPurchases.fulfilled, (s, { payload }) => {
        s.loading = false;
        s.items = Array.isArray(payload) ? payload : payload?.purchases || [];
      })
      .addCase(fetchPurchases.rejected, (s, { payload }) => { s.loading = false; s.error = payload; })
      .addCase(fetchPurchaseById.fulfilled, (s, { payload }) => { s.selected = payload?.purchase || payload; })
      .addCase(createPurchase.fulfilled, (s, { payload }) => { s.items.unshift(payload?.purchase || payload); });
  },
});

export const { setSelected, clearSelected } = purchasesSlice.actions;
export const selectPurchases = (s) => s.purchases.items;
export const selectPurchaseSelected = (s) => s.purchases.selected;
export const selectPurchasesLoading = (s) => s.purchases.loading;
export default purchasesSlice.reducer;
