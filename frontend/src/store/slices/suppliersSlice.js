import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { suppliersApi } from '../../api/suppliers.api';
import { getErrorMessage } from '../../api/client';

export const fetchSuppliers = createAsyncThunk('suppliers/fetchAll', async (params = {}, { rejectWithValue }) => {
  try { const res = await suppliersApi.getAll(params); return res.data.data || res.data; }
  catch (e) { return rejectWithValue(getErrorMessage(e)); }
});

export const fetchSupplierById = createAsyncThunk('suppliers/fetchById', async (id, { rejectWithValue }) => {
  try { const res = await suppliersApi.getById(id); return res.data.data || res.data; }
  catch (e) { return rejectWithValue(getErrorMessage(e)); }
});

export const createSupplier = createAsyncThunk('suppliers/create', async (data, { rejectWithValue }) => {
  try { const res = await suppliersApi.create(data); return res.data.data || res.data; }
  catch (e) { return rejectWithValue(getErrorMessage(e)); }
});

export const updateSupplier = createAsyncThunk('suppliers/update', async ({ id, data }, { rejectWithValue }) => {
  try { const res = await suppliersApi.update(id, data); return res.data.data || res.data; }
  catch (e) { return rejectWithValue(getErrorMessage(e)); }
});

export const deleteSupplier = createAsyncThunk('suppliers/delete', async (id, { rejectWithValue }) => {
  try { await suppliersApi.delete(id); return id; }
  catch (e) { return rejectWithValue(getErrorMessage(e)); }
});

export const fetchSupplierStats = createAsyncThunk('suppliers/stats', async (params = {}, { rejectWithValue }) => {
  try { const res = await suppliersApi.getStats(params); return res.data.data || res.data; }
  catch (e) { return rejectWithValue(getErrorMessage(e)); }
});

const suppliersSlice = createSlice({
  name: 'suppliers',
  initialState: {
    list: [], selectedSupplier: null, stats: null,
    loading: false, error: null,
  },
  reducers: {
    clearSelectedSupplier: (s) => { s.selectedSupplier = null; }
  },
  extraReducers: (builder) => {
    const pending = (s) => { s.loading = true; s.error = null; };
    const rejected = (s, { payload }) => { s.loading = false; s.error = payload; };
    builder
      .addCase(fetchSuppliers.pending, pending)
      .addCase(fetchSuppliers.fulfilled, (s, { payload }) => {
        s.loading = false;
        s.list = Array.isArray(payload) ? payload : payload?.suppliers || [];
      })
      .addCase(fetchSuppliers.rejected, rejected)
      .addCase(fetchSupplierById.fulfilled, (s, { payload }) => { s.loading = false; s.selectedSupplier = payload; })
      .addCase(createSupplier.fulfilled, (s, { payload }) => { s.list.unshift(payload); })
      .addCase(updateSupplier.fulfilled, (s, { payload }) => {
        const idx = s.list.findIndex(c => c.id === payload.id);
        if (idx !== -1) s.list[idx] = payload;
      })
      .addCase(deleteSupplier.fulfilled, (s, { payload }) => {
        s.list = s.list.filter(c => c.id !== payload);
      })
      .addCase(fetchSupplierStats.fulfilled, (s, { payload }) => { s.stats = payload; });
  },
});

export const { clearSelectedSupplier } = suppliersSlice.actions;
export const selectSuppliers = (s) => s.suppliers.list;
export const selectSelectedSupplier = (s) => s.suppliers.selectedSupplier;
export const selectSupplierStats = (s) => s.suppliers.stats;
export const selectSuppliersLoading = (s) => s.suppliers.loading;
export default suppliersSlice.reducer;
