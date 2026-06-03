import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, ChevronDown, LogOut, Store, Menu, Check, Building2 } from 'lucide-react';
import { selectUser } from '../../store/slices/authSlice';
import { selectDashboardLowStock } from '../../store/slices/dashboardSlice';
import { logoutUser } from '../../store/slices/authSlice';
import { selectMobileMenuOpen, toggleMobileMenu, selectActiveShopId, selectActiveShopCode, selectActiveShopName, setActiveShop, selectActiveShopRole } from '../../store/slices/uiSlice';
import { selectShops } from '../../store/slices/shopsSlice';
import { clearUsers } from '../../store/slices/usersSlice';
import { NAV_ITEMS } from '../../utils/constants';
import { cn } from '../../utils/cn';
import { toast } from 'sonner';

// Build breadcrumb from current path
function useBreadcrumb(pathname) {
  const allRoutes = [];
  NAV_ITEMS.forEach((item) => {
    if (item.path) allRoutes.push({ path: item.path, label: item.label });
    if (item.children) {
      item.children.forEach((child) => allRoutes.push({ path: child.path, label: child.label }));
    }
  });

  const match = allRoutes.find((r) => pathname.startsWith(r.path) && r.path !== '/');
  if (match) return match.label;
  if (pathname === '/dashboard') return 'Dashboard';
  if (pathname.includes('/sales/new')) return 'New Sale';
  if (pathname.includes('/sales/')) return 'Sale Detail';
  if (pathname.includes('/purchases/new')) return 'New Purchase';
  if (pathname.includes('/purchases/')) return 'Purchase Detail';
  return 'Aroma B2B';
}

export default function TopBar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector(selectUser);
  const lowStock = useSelector(selectDashboardLowStock);
  const shops = useSelector(selectShops);
  const activeShopId = useSelector(selectActiveShopId);
  const activeShopCode = useSelector(selectActiveShopCode);
  const activeShopName = useSelector(selectActiveShopName);
  const activeShopRole = useSelector(selectActiveShopRole);

  const userRole = (activeShopRole || user?.role || '').toUpperCase();
  const isAdmin = userRole === 'ADMIN';

  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [shopDropdownOpen, setShopDropdownOpen] = useState(false);
  const userDropdownRef = useRef(null);
  const shopDropdownRef = useRef(null);

  const pageTitle = useBreadcrumb(location.pathname);
  const lowStockCount = lowStock?.length || 0;

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
      }
      if (shopDropdownRef.current && !shopDropdownRef.current.contains(e.target)) {
        setShopDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const handleShopSwitch = (shop) => {
    dispatch(setActiveShop({ id: shop.id, shopCode: shop.shopCode, name: shop.shopName || shop.name, role: shop.role }));
    dispatch(clearUsers()); // Clear users list so it reloads for the new shop
    setShopDropdownOpen(false);
    toast.success(`Switched to ${shop.shopName || shop.name}`);
  };

  return (
    <header className="h-16 bg-bg border-b border-border flex items-center px-4 lg:px-6 gap-4 flex-shrink-0">
      {/* Mobile menu toggle */}
      <button
        onClick={() => dispatch(toggleMobileMenu())}
        className="p-2 rounded-xl hover:bg-navy/5 transition-colors lg:hidden flex items-center justify-center text-navyDeep"
        title="Open navigation menu"
      >
        <Menu size={20} />
      </button>

      {/* Breadcrumb */}
      <div className="flex-shrink-0">
        <h1 className="font-display font-semibold text-navy text-lg">{pageTitle}</h1>
      </div>

      <div className="flex items-center gap-3 ml-auto">
        {/* Low Stock Notification Bell */}
        <button
          onClick={() => navigate('/inventory/low-stock')}
          className="relative p-2 rounded-xl hover:bg-navy/5 transition-colors"
          title="Low stock alerts"
        >
          <Bell size={18} className="text-grayMid" />
          {lowStockCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
              {lowStockCount > 9 ? '9+' : lowStockCount}
            </span>
          )}
        </button>

        {/* Shop Switcher */}
        <div className="relative hidden sm:block" ref={shopDropdownRef}>
          <button
            onClick={() => shops.length > 0 && setShopDropdownOpen(!shopDropdownOpen)}
            className={cn(
              'flex items-center gap-2 rounded-xl px-3 py-1.5 border transition-all duration-200',
              shopDropdownOpen
                ? 'bg-navy/10 border-navy/20'
                : 'bg-navy/5 border-border hover:bg-navy/8 hover:border-navy/15',
              shops.length === 0 && 'cursor-default opacity-85 hover:bg-navy/5 hover:border-border'
            )}
          >
            <Store size={13} className="text-neon flex-shrink-0" />
            <span className="text-xs font-semibold text-navy max-w-[140px] truncate">
              {shops.length === 0 
                ? 'No Shop' 
                : activeShopName 
                  ? `${activeShopName}${activeShopCode ? ` (#${activeShopCode})` : ''}` 
                  : 'Select Shop'}
            </span>
            {shops.length > 1 && (
              <ChevronDown
                size={12}
                className={cn('text-grayMid transition-transform flex-shrink-0', shopDropdownOpen && 'rotate-180')}
              />
            )}
          </button>

          <AnimatePresence>
            {shopDropdownOpen && shops.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-64 bg-white border border-border rounded-2xl shadow-dropdown overflow-hidden z-50"
              >
                {/* Header */}
                <div className="px-4 py-3 border-b border-border bg-bg/50">
                  <p className="text-xs font-semibold text-grayMid uppercase tracking-wide">Your Shops</p>
                </div>

                {/* Shop List */}
                <div className="p-2 max-h-60 overflow-y-auto">
                  {shops.map((shop) => {
                    const isActive = shop.id === activeShopId;
                    return (
                      <button
                        key={shop.id}
                        onClick={() => handleShopSwitch(shop)}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors',
                          isActive
                            ? 'bg-neon/10 text-navy'
                            : 'text-grayMid hover:bg-bg hover:text-navy'
                        )}
                      >
                        <div className={cn(
                          'w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0',
                          isActive ? 'bg-neon/20' : 'bg-border'
                        )}>
                          <Building2 size={14} className={isActive ? 'text-neon' : 'text-grayMid'} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn('text-sm font-medium truncate', isActive && 'text-navy')}>
                            {shop.shopName || shop.name} {shop.shopCode ? `(#${shop.shopCode})` : ''}
                          </p>
                          {shop.businessType && (
                            <p className="text-xs text-grayMid truncate">{shop.businessType}</p>
                          )}
                        </div>
                        {isActive && <Check size={14} className="text-neon flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                {/* Footer hint */}
                {isAdmin && (
                  <div className="px-4 py-2 border-t border-border bg-bg/30">
                    <p className="text-xs text-grayMid">
                      Manage shops in{' '}
                      <button
                        onClick={() => { setShopDropdownOpen(false); navigate('/shops'); }}
                        className="text-neon font-medium hover:underline"
                      >
                        Shops
                      </button>
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User Avatar + Dropdown */}
        <div className="relative" ref={userDropdownRef}>
          <button
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="flex items-center gap-2 hover:bg-navy/5 rounded-xl px-2 py-1.5 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-navy flex items-center justify-center">
              <span className="text-neon font-semibold text-xs">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <span className="text-sm font-medium text-navy hidden sm:block max-w-[120px] truncate">
              {user?.name || 'User'}
            </span>
            <ChevronDown size={14} className="text-grayMid" />
          </button>

          <AnimatePresence>
            {userDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-48 bg-white border border-border rounded-2xl shadow-dropdown overflow-hidden z-50"
              >
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-sm font-semibold text-navy truncate">{user?.name}</p>
                  <p className="text-xs text-grayMid truncate">{user?.email}</p>
                </div>
                <div className="p-2">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={15} />
                    Sign Out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
