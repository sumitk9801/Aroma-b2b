import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { productsApi } from '../../api/products.api';
import { getErrorMessage } from '../../api/client';

// ─── Async Thunks ─────────────────────────────────────────────────────────────

export const fetchProducts = createAsyncThunk(
  'products/fetchAll',
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await productsApi.getAll(params);
      return res.data.data || res.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const fetchProductById = createAsyncThunk(
  'products/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const res = await productsApi.getById(id);
      return res.data.data || res.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const fetchLowStockProducts = createAsyncThunk(
  'products/fetchLowStock',
  async (_, { rejectWithValue }) => {
    try {
      const res = await productsApi.getLowStock();
      return res.data.data || res.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const createProduct = createAsyncThunk(
  'products/create',
  async (data, { rejectWithValue }) => {
    try {
      const res = await productsApi.create(data);
      return res.data.data || res.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const updateProduct = createAsyncThunk(
  'products/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await productsApi.update(id, data);
      return res.data.data || res.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const deleteProduct = createAsyncThunk(
  'products/delete',
  async (id, { rejectWithValue }) => {
    try {
      await productsApi.delete(id);
      return id;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const productsSlice = createSlice({
  name: 'products',
  initialState: {
    items: [],
    lowStockItems: [],
    selected: null,
    loading: false,
    error: null,
    filters: {
      search: '',
      categoryId: '',
      isActive: null,
      lowStock: false,
    },
  },
  reducers: {
    setFilter: (state, { payload }) => {
      state.filters = { ...state.filters, ...payload };
    },
    setSelected: (state, { payload }) => {
      state.selected = payload;
    },
    clearSelected: (state) => {
      state.selected = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchProducts.fulfilled, (s, { payload }) => {
        s.loading = false;
        s.items = Array.isArray(payload) ? payload : payload?.products || [];
      })
      .addCase(fetchProducts.rejected, (s, { payload }) => {
        s.loading = false; s.error = payload;
      })

      .addCase(fetchLowStockProducts.fulfilled, (s, { payload }) => {
        s.lowStockItems = Array.isArray(payload) ? payload : payload?.products || [];
      })

      .addCase(createProduct.fulfilled, (s, { payload }) => {
        s.items.unshift(payload);
      })

      .addCase(updateProduct.fulfilled, (s, { payload }) => {
        const idx = s.items.findIndex((p) => p.id === payload.id);
        if (idx !== -1) s.items[idx] = payload;
        if (s.selected?.id === payload.id) s.selected = payload;
      })

      .addCase(deleteProduct.fulfilled, (s, { payload }) => {
        s.items = s.items.filter((p) => p.id !== payload);
      });
  },
});

export const { setFilter, setSelected, clearSelected, clearError } = productsSlice.actions;

export const selectProducts = (state) => state.products.items;
export const selectProductsLoading = (state) => state.products.loading;
export const selectProductFilters = (state) => state.products.filters;
export const selectLowStockProducts = (state) => state.products.lowStockItems;
export const selectSelectedProduct = (state) => state.products.selected;

export default productsSlice.reducer;
