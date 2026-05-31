import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    sidebarCollapsed: false,
  },
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setSidebarCollapsed: (state, { payload }) => {
      state.sidebarCollapsed = payload;
    },
  },
});

export const { toggleSidebar, setSidebarCollapsed } = uiSlice.actions;
export const selectSidebarCollapsed = (state) => state.ui.sidebarCollapsed;
export default uiSlice.reducer;
