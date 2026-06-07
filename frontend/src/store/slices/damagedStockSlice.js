import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { damagedStockApi } from '../../api/damagedStock.api';
import { getErrorMessage } from '../../api/client';

export const reportDamage = createAsyncThunk('damagedStock/report', async (data, { rejectWithValue }) => {
  try { const res = await damagedStockApi.report(data); return res.data.data || res.data; }
  catch (e) { return rejectWithValue(getErrorMessage(e)); }
});

export const fetchDamageReports = createAsyncThunk('damagedStock/fetchAll', async (params = {}, { rejectWithValue }) => {
  try { const res = await damagedStockApi.getAll(params); return res.data.data || res.data; }
  catch (e) { return rejectWithValue(getErrorMessage(e)); }
});

export const fetchDamageSummary = createAsyncThunk('damagedStock/summary', async (params = {}, { rejectWithValue }) => {
  try { const res = await damagedStockApi.getSummary(params); return res.data.data || res.data; }
  catch (e) { return rejectWithValue(getErrorMessage(e)); }
});

const damagedStockSlice = createSlice({
  name: 'damagedStock',
  initialState: {
    reports: [], summary: null,
    loading: false, error: null, submitSuccess: false,
  },
  reducers: {
    clearSubmitSuccess: (s) => { s.submitSuccess = false; }
  },
  extraReducers: (builder) => {
    const pending = (s) => { s.loading = true; s.error = null; s.submitSuccess = false; };
    const rejected = (s, { payload }) => { s.loading = false; s.error = payload; };
    builder
      .addCase(reportDamage.pending, pending)
      .addCase(reportDamage.fulfilled, (s, { payload }) => {
        s.loading = false; s.submitSuccess = true;
        s.reports.unshift(payload);
      })
      .addCase(reportDamage.rejected, rejected)
      .addCase(fetchDamageReports.pending, pending)
      .addCase(fetchDamageReports.fulfilled, (s, { payload }) => {
        s.loading = false;
        s.reports = Array.isArray(payload) ? payload : payload?.reports || [];
      })
      .addCase(fetchDamageReports.rejected, rejected)
      .addCase(fetchDamageSummary.fulfilled, (s, { payload }) => { s.summary = payload; });
  },
});

export const { clearSubmitSuccess } = damagedStockSlice.actions;
export const selectDamageReports = (s) => s.damagedStock.reports;
export const selectDamageSummary = (s) => s.damagedStock.summary;
export const selectDamagedStockLoading = (s) => s.damagedStock.loading;
export const selectDamageSubmitSuccess = (s) => s.damagedStock.submitSuccess;
export default damagedStockSlice.reducer;
