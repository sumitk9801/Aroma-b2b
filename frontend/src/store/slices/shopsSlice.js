import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { shopsApi } from '../../api/shops.api';
import { getErrorMessage } from '../../api/client';
import { setActiveShop } from './uiSlice';

export const fetchShops = createAsyncThunk('shops/fetchAll', async (params = {}, { dispatch, getState, rejectWithValue }) => {
  try {
    const res = await shopsApi.getAll(params);
    const shops = res.data.data || res.data;
    const list = Array.isArray(shops) ? shops : shops?.shops || [];

    // Auto-select if exactly 1 shop exists, otherwise let user select
    const activeShopId = getState().ui.activeShopId;
    if (list.length === 0) {
      dispatch(setActiveShop(null));
    } else if (list.length === 1) {
      dispatch(setActiveShop({ id: list[0].id, shopCode: list[0].shopCode, name: list[0].shopName || list[0].name, role: list[0].role }));
    } else if (activeShopId) {
      // Validate that stored activeShopId still exists in the list
      const stillExists = list.find((s) => s.id === activeShopId);
      if (!stillExists) {
        dispatch(setActiveShop(null));
      } else {
        // Sync active shop details in case it changed in the database
        dispatch(setActiveShop({ id: stillExists.id, shopCode: stillExists.shopCode, name: stillExists.shopName || stillExists.name, role: stillExists.role }));
      }
    } else {
      // Multiple shops exist but none selected yet -> prompt selection
      dispatch(setActiveShop(null));
    }

    return list;
  } catch (e) { return rejectWithValue(getErrorMessage(e)); }
});

export const createShop = createAsyncThunk('shops/create', async (data, { dispatch, rejectWithValue }) => {
  try {
    const res = await shopsApi.create(data);
    const shop = res.data.data || res.data;
    const shopObj = shop?.shop || shop;
    // Auto-switch to the newly created shop
    dispatch(setActiveShop({ id: shopObj.id, shopCode: shopObj.shopCode, name: shopObj.shopName || shopObj.name, role: 'admin' }));
    return shopObj;
  } catch (e) { return rejectWithValue(getErrorMessage(e)); }
});

export const updateShop = createAsyncThunk('shops/update', async ({ id, data }, { getState, dispatch, rejectWithValue }) => {
  try {
    const res = await shopsApi.update(id, data);
    const shop = res.data.data || res.data;
    const shopObj = shop?.shop || shop;
    // Update active shop name if this is the currently active shop
    const activeShopId = getState().ui.activeShopId;
    const activeShopRole = getState().ui.activeShopRole;
    if (activeShopId === id) {
      dispatch(setActiveShop({ id: shopObj.id, shopCode: shopObj.shopCode, name: shopObj.shopName || shopObj.name, role: activeShopRole }));
    }
    return shopObj;
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
