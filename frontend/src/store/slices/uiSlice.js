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
    activeShopCode: savedShop?.shopCode || null,
    activeShopName: savedShop?.name || '',
    activeShopRole: savedShop?.role || '',
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
      // payload: { id, shopCode, name, role } or null to clear
      if (payload) {
        state.activeShopId = payload.id;
        state.activeShopCode = payload.shopCode;
        state.activeShopName = payload.name;
        state.activeShopRole = payload.role;
        localStorage.setItem(LS_ACTIVE_SHOP_KEY, JSON.stringify({ 
          id: payload.id, 
          shopCode: payload.shopCode, 
          name: payload.name, 
          role: payload.role 
        }));
      } else {
        state.activeShopId = null;
        state.activeShopCode = null;
        state.activeShopName = '';
        state.activeShopRole = '';
        localStorage.removeItem(LS_ACTIVE_SHOP_KEY);
      }
    },
  },
  extraReducers: (builder) => {
    builder.addCase('auth/logout/fulfilled', (state) => {
      state.activeShopId = null;
      state.activeShopCode = null;
      state.activeShopName = '';
      state.activeShopRole = '';
      localStorage.removeItem(LS_ACTIVE_SHOP_KEY);
    });
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
export const selectActiveShopCode = (state) => state.ui.activeShopCode;
export const selectActiveShopName = (state) => state.ui.activeShopName;
export const selectActiveShopRole = (state) => state.ui.activeShopRole;

export default uiSlice.reducer;
