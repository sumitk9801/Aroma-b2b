import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { shopsApi } from '../../api/shops.api';
import { getErrorMessage } from '../../api/client';

export const fetchShops = createAsyncThunk('shops/fetchAll', async (params = {}, { rejectWithValue }) => {
  try {
    const res = await shopsApi.getAll(params);
    return res.data.data || res.data;
  } catch (e) { return rejectWithValue(getErrorMessage(e)); }
});

export const createShop = createAsyncThunk('shops/create', async (data, { rejectWithValue }) => {
  try {
    const res = await shopsApi.create(data);
    return res.data.data || res.data;
  } catch (e) { return rejectWithValue(getErrorMessage(e)); }
});

export const updateShop = createAsyncThunk('shops/update', async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await shopsApi.update(id, data);
    return res.data.data || res.data;
  } catch (e) { return rejectWithValue(getErrorMessage(e)); }
});

const shopsSlice = createSlice({
  name: 'shops',
  initialState: { items: [], selected: null, loading: false, error: null },
  reducers: {
    setSelected: (s, { payload }) => { s.selected = payload; },
    clearSelected: (s) => { s.selected = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchShops.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchShops.fulfilled, (s, { payload }) => {
        s.loading = false;
        s.items = Array.isArray(payload) ? payload : payload?.shops || [];
      })
      .addCase(fetchShops.rejected, (s, { payload }) => { s.loading = false; s.error = payload; })
      .addCase(createShop.fulfilled, (s, { payload }) => { s.items.unshift(payload?.shop || payload); })
      .addCase(updateShop.fulfilled, (s, { payload }) => {
        const p = payload?.shop || payload;
        const idx = s.items.findIndex((sh) => sh.id === p.id);
        if (idx !== -1) s.items[idx] = p;
      });
  },
});

export const { setSelected, clearSelected } = shopsSlice.actions;
export const selectShops = (s) => s.shops.items;
export const selectShopsLoading = (s) => s.shops.loading;
export const selectShopSelected = (s) => s.shops.selected;
export default shopsSlice.reducer;
