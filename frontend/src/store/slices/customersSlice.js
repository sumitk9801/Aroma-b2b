import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { customersApi } from '../../api/customers.api';
import { getErrorMessage } from '../../api/client';

export const fetchCustomers = createAsyncThunk('customers/fetchAll', async (params = {}, { rejectWithValue }) => {
  try { const res = await customersApi.getAll(params); return res.data.data || res.data; }
  catch (e) { return rejectWithValue(getErrorMessage(e)); }
});

export const fetchCustomerById = createAsyncThunk('customers/fetchById', async (id, { rejectWithValue }) => {
  try { const res = await customersApi.getById(id); return res.data.data || res.data; }
  catch (e) { return rejectWithValue(getErrorMessage(e)); }
});

export const createCustomer = createAsyncThunk('customers/create', async (data, { rejectWithValue }) => {
  try { const res = await customersApi.create(data); return res.data.data || res.data; }
  catch (e) { return rejectWithValue(getErrorMessage(e)); }
});

export const updateCustomer = createAsyncThunk('customers/update', async ({ id, data }, { rejectWithValue }) => {
  try { const res = await customersApi.update(id, data); return res.data.data || res.data; }
  catch (e) { return rejectWithValue(getErrorMessage(e)); }
});

export const deleteCustomer = createAsyncThunk('customers/delete', async (id, { rejectWithValue }) => {
  try { await customersApi.delete(id); return id; }
  catch (e) { return rejectWithValue(getErrorMessage(e)); }
});

export const fetchCustomerStats = createAsyncThunk('customers/stats', async (params = {}, { rejectWithValue }) => {
  try { const res = await customersApi.getStats(params); return res.data.data || res.data; }
  catch (e) { return rejectWithValue(getErrorMessage(e)); }
});

const customersSlice = createSlice({
  name: 'customers',
  initialState: {
    list: [], selectedCustomer: null, stats: null,
    loading: false, error: null,
  },
  reducers: {
    clearSelectedCustomer: (s) => { s.selectedCustomer = null; }
  },
  extraReducers: (builder) => {
    const pending = (s) => { s.loading = true; s.error = null; };
    const rejected = (s, { payload }) => { s.loading = false; s.error = payload; };
    builder
      .addCase(fetchCustomers.pending, pending)
      .addCase(fetchCustomers.fulfilled, (s, { payload }) => {
        s.loading = false;
        s.list = Array.isArray(payload) ? payload : payload?.customers || [];
      })
      .addCase(fetchCustomers.rejected, rejected)
      .addCase(fetchCustomerById.pending, pending)
      .addCase(fetchCustomerById.fulfilled, (s, { payload }) => { s.loading = false; s.selectedCustomer = payload; })
      .addCase(fetchCustomerById.rejected, rejected)
      .addCase(createCustomer.fulfilled, (s, { payload }) => { s.list.unshift(payload); })
      .addCase(updateCustomer.fulfilled, (s, { payload }) => {
        const idx = s.list.findIndex(c => c.id === payload.id);
        if (idx !== -1) s.list[idx] = payload;
        if (s.selectedCustomer?.id === payload.id) s.selectedCustomer = payload;
      })
      .addCase(deleteCustomer.fulfilled, (s, { payload }) => {
        s.list = s.list.filter(c => c.id !== payload);
      })
      .addCase(fetchCustomerStats.fulfilled, (s, { payload }) => { s.stats = payload; });
  },
});

export const { clearSelectedCustomer } = customersSlice.actions;
export const selectCustomers = (s) => s.customers.list;
export const selectSelectedCustomer = (s) => s.customers.selectedCustomer;
export const selectCustomerStats = (s) => s.customers.stats;
export const selectCustomersLoading = (s) => s.customers.loading;
export default customersSlice.reducer;
