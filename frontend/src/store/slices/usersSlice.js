import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { usersApi } from '../../api/users.api';
import { getErrorMessage } from '../../api/client';

// Fetch users scoped to a specific shop
export const fetchUsers = createAsyncThunk('users/fetchAll', async (params = {}, { rejectWithValue }) => {
  try {
    const res = await usersApi.getAll(params);
    return res.data.data || res.data;
  } catch (e) { return rejectWithValue(getErrorMessage(e)); }
});

// Create user — body must include shopId
export const createUser = createAsyncThunk('users/create', async (data, { rejectWithValue }) => {
  try {
    const res = await usersApi.create(data);
    return res.data.data || res.data;
  } catch (e) { return rejectWithValue(getErrorMessage(e)); }
});

// Update user profile details
export const updateUser = createAsyncThunk('users/update', async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await usersApi.update(id, data);
    return res.data.data || res.data;
  } catch (e) { return rejectWithValue(getErrorMessage(e)); }
});

// Delete/remove user from a shop — passes shopId as query param
export const deleteUser = createAsyncThunk('users/delete', async ({ id, shopId }, { rejectWithValue }) => {
  try {
    await usersApi.delete(id, shopId);
    return id;
  } catch (e) { return rejectWithValue(getErrorMessage(e)); }
});

const usersSlice = createSlice({
  name: 'users',
  initialState: { items: [], selected: null, loading: false, error: null },
  reducers: {
    setSelected: (s, { payload }) => { s.selected = payload; },
    clearSelected: (s) => { s.selected = null; },
    clearUsers: (s) => { s.items = []; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchUsers.fulfilled, (s, { payload }) => {
        s.loading = false;
        s.items = Array.isArray(payload) ? payload : payload?.users || [];
      })
      .addCase(fetchUsers.rejected, (s, { payload }) => { s.loading = false; s.error = payload; })
      .addCase(createUser.fulfilled, (s, { payload }) => { s.items.unshift(payload?.user || payload); })
      .addCase(updateUser.fulfilled, (s, { payload }) => {
        const p = payload?.user || payload;
        const idx = s.items.findIndex((u) => u.id === p.id);
        if (idx !== -1) s.items[idx] = { ...s.items[idx], ...p };
      })
      .addCase(deleteUser.fulfilled, (s, { payload }) => {
        s.items = s.items.filter((u) => u.id !== payload);
      });
  },
});

export const { setSelected, clearSelected, clearUsers } = usersSlice.actions;
export const selectUsers = (s) => s.users.items;
export const selectUsersLoading = (s) => s.users.loading;
export const selectUserSelected = (s) => s.users.selected;
export default usersSlice.reducer;
