import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { productRequestsApi } from '../../api/productRequests.api';
import { getErrorMessage } from '../../api/client';

// ─── Async Thunks ─────────────────────────────────────────────────────────────

export const fetchProductRequests = createAsyncThunk(
  'productRequests/fetchAll',
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await productRequestsApi.getAll(params);
      return res.data.data || res.data;
    } catch (e) { return rejectWithValue(getErrorMessage(e)); }
  }
);

export const fetchPendingCount = createAsyncThunk(
  'productRequests/pendingCount',
  async (_, { rejectWithValue }) => {
    try {
      const res = await productRequestsApi.getPendingCount();
      return (res.data.data || res.data)?.pendingCount ?? 0;
    } catch (e) { return rejectWithValue(getErrorMessage(e)); }
  }
);

export const submitProductRequest = createAsyncThunk(
  'productRequests/submit',
  async (data, { rejectWithValue }) => {
    try {
      const res = await productRequestsApi.create(data);
      return res.data.data || res.data;
    } catch (e) { return rejectWithValue(getErrorMessage(e)); }
  }
);

export const approveProductRequest = createAsyncThunk(
  'productRequests/approve',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await productRequestsApi.approve(id, data);
      return res.data.data || res.data;
    } catch (e) { return rejectWithValue(getErrorMessage(e)); }
  }
);

export const rejectProductRequest = createAsyncThunk(
  'productRequests/reject',
  async ({ id, reviewNote }, { rejectWithValue }) => {
    try {
      const res = await productRequestsApi.reject(id, { reviewNote });
      return res.data.data || res.data;
    } catch (e) { return rejectWithValue(getErrorMessage(e)); }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const productRequestsSlice = createSlice({
  name: 'productRequests',
  initialState: {
    items: [],
    pendingCount: 0,
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (s) => { s.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProductRequests.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchProductRequests.fulfilled, (s, { payload }) => {
        s.loading = false;
        s.items = Array.isArray(payload) ? payload : [];
      })
      .addCase(fetchProductRequests.rejected, (s, { payload }) => { s.loading = false; s.error = payload; })

      .addCase(fetchPendingCount.fulfilled, (s, { payload }) => { s.pendingCount = payload; })

      .addCase(submitProductRequest.fulfilled, (s, { payload }) => {
        s.items.unshift(payload);
      })

      .addCase(approveProductRequest.fulfilled, (s, { payload }) => {
        // payload = { request, product }
        const updatedReq = payload?.request || payload;
        const idx = s.items.findIndex((r) => r.id === updatedReq?.id);
        if (idx !== -1) s.items[idx] = updatedReq;
        if (s.pendingCount > 0) s.pendingCount -= 1;
      })

      .addCase(rejectProductRequest.fulfilled, (s, { payload }) => {
        const idx = s.items.findIndex((r) => r.id === payload?.id);
        if (idx !== -1) s.items[idx] = payload;
        if (s.pendingCount > 0) s.pendingCount -= 1;
      });
  },
});

export const { clearError } = productRequestsSlice.actions;

export const selectProductRequests = (s) => s.productRequests.items;
export const selectProductRequestsLoading = (s) => s.productRequests.loading;
export const selectPendingRequestsCount = (s) => s.productRequests.pendingCount;

export default productRequestsSlice.reducer;
