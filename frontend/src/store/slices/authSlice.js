import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authApi } from '../../api/auth.api';
import { LS_TOKEN_KEY } from '../../utils/constants';
import { getErrorMessage } from '../../api/client';
import { setActiveShop } from './uiSlice';

// ─── Async Thunks ─────────────────────────────────────────────────────────────

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { dispatch, rejectWithValue }) => {
    try {
      const res = await authApi.login(credentials);
      const { token, user, assignedShop } = res.data.data || res.data;
      localStorage.setItem(LS_TOKEN_KEY, token);
      if (assignedShop) {
        dispatch(setActiveShop(assignedShop));
      }
      return { token, user };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const res = await authApi.register(userData);
      return res.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authApi.logout();
    } catch {
      // Silently fail — still clear local state
    } finally {
      localStorage.removeItem(LS_TOKEN_KEY);
    }
  }
);

export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const res = await authApi.getMe();
      return res.data.data || res.data;
    } catch (error) {
      localStorage.removeItem(LS_TOKEN_KEY);
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: localStorage.getItem(LS_TOKEN_KEY) || null,
    isAuthenticated: false,
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearAuth: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem(LS_TOKEN_KEY);
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(loginUser.fulfilled, (s, { payload }) => {
        s.loading = false;
        s.token = payload.token;
        s.user = payload.user;
        s.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (s, { payload }) => {
        s.loading = false;
        s.error = payload;
      })

      // Register
      .addCase(registerUser.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(registerUser.fulfilled, (s) => { s.loading = false; })
      .addCase(registerUser.rejected, (s, { payload }) => {
        s.loading = false;
        s.error = payload;
      })

      // Logout
      .addCase(logoutUser.fulfilled, (s) => {
        s.user = null;
        s.token = null;
        s.isAuthenticated = false;
      })

      // Fetch current user
      .addCase(fetchCurrentUser.pending, (s) => { s.loading = true; })
      .addCase(fetchCurrentUser.fulfilled, (s, { payload }) => {
        s.loading = false;
        s.user = payload.user || payload;
        s.isAuthenticated = true;
      })
      .addCase(fetchCurrentUser.rejected, (s) => {
        s.loading = false;
        s.user = null;
        s.token = null;
        s.isAuthenticated = false;
      });
  },
});

export const { clearError, clearAuth } = authSlice.actions;

// ─── Selectors ────────────────────────────────────────────────────────────────
export const selectAuth = (state) => state.auth;
export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectIsAdmin = (state) => state.auth.user?.role === 'admin';

export default authSlice.reducer;
