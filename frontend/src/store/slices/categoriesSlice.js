import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { categoriesApi } from '../../api/categories.api';
import { getErrorMessage } from '../../api/client';

export const fetchCategories = createAsyncThunk('categories/fetchAll', async (params = {}, { rejectWithValue }) => {
  try {
    const res = await categoriesApi.getAll(params);
    return res.data.data || res.data;
  } catch (e) { return rejectWithValue(getErrorMessage(e)); }
});

export const createCategory = createAsyncThunk('categories/create', async (data, { rejectWithValue }) => {
  try {
    const res = await categoriesApi.create(data);
    return res.data.data || res.data;
  } catch (e) { return rejectWithValue(getErrorMessage(e)); }
});

export const updateCategory = createAsyncThunk('categories/update', async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await categoriesApi.update(id, data);
    return res.data.data || res.data;
  } catch (e) { return rejectWithValue(getErrorMessage(e)); }
});

export const deleteCategory = createAsyncThunk('categories/delete', async (id, { rejectWithValue }) => {
  try {
    await categoriesApi.delete(id);
    return id;
  } catch (e) { return rejectWithValue(getErrorMessage(e)); }
});

const categoriesSlice = createSlice({
  name: 'categories',
  initialState: { items: [], selected: null, loading: false, error: null },
  reducers: {
    setSelected: (s, { payload }) => { s.selected = payload; },
    clearSelected: (s) => { s.selected = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchCategories.fulfilled, (s, { payload }) => {
        s.loading = false;
        s.items = Array.isArray(payload) ? payload : payload?.categories || [];
      })
      .addCase(fetchCategories.rejected, (s, { payload }) => { s.loading = false; s.error = payload; })
      .addCase(createCategory.fulfilled, (s, { payload }) => { s.items.unshift(payload?.category || payload); })
      .addCase(updateCategory.fulfilled, (s, { payload }) => {
        const p = payload?.category || payload;
        const idx = s.items.findIndex((c) => c.id === p.id);
        if (idx !== -1) s.items[idx] = p;
      })
      .addCase(deleteCategory.fulfilled, (s, { payload }) => {
        s.items = s.items.filter((c) => c.id !== payload);
      });
  },
});

export const { setSelected, clearSelected } = categoriesSlice.actions;
export const selectCategories = (s) => s.categories.items;
export const selectCategoriesLoading = (s) => s.categories.loading;
export const selectCategorySelected = (s) => s.categories.selected;
export default categoriesSlice.reducer;
