import { createSlice } from '@reduxjs/toolkit';

const LS_ACTIVE_SHOP_KEY = 'aroma_active_shop';

// Restore active shop from localStorage on app boot
const loadActiveShop = () => {
  try {
    const stored = localStorage.getItem(LS_ACTIVE_SHOP_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const savedShop = loadActiveShop();

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    sidebarCollapsed: false,
    mobileMenuOpen: false,
    // Active shop tracking — persisted to localStorage
    activeShopId: savedShop?.id || null,
    activeShopName: savedShop?.name || '',
  },
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setSidebarCollapsed: (state, { payload }) => {
      state.sidebarCollapsed = payload;
    },
    toggleMobileMenu: (state) => {
      state.mobileMenuOpen = !state.mobileMenuOpen;
    },
    setMobileMenuOpen: (state, { payload }) => {
      state.mobileMenuOpen = payload;
    },
    setActiveShop: (state, { payload }) => {
      // payload: { id, name } or null to clear
      if (payload) {
        state.activeShopId = payload.id;
        state.activeShopName = payload.name;
        localStorage.setItem(LS_ACTIVE_SHOP_KEY, JSON.stringify({ id: payload.id, name: payload.name }));
      } else {
        state.activeShopId = null;
        state.activeShopName = '';
        localStorage.removeItem(LS_ACTIVE_SHOP_KEY);
      }
    },
  },
});

export const {
  toggleSidebar,
  setSidebarCollapsed,
  toggleMobileMenu,
  setMobileMenuOpen,
  setActiveShop,
} = uiSlice.actions;

export const selectSidebarCollapsed = (state) => state.ui.sidebarCollapsed;
export const selectMobileMenuOpen = (state) => state.ui.mobileMenuOpen;
export const selectActiveShopId = (state) => state.ui.activeShopId;
export const selectActiveShopName = (state) => state.ui.activeShopName;

export default uiSlice.reducer;
