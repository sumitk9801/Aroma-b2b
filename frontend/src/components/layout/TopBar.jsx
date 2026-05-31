import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, ChevronDown, LogOut, User, Store } from 'lucide-react';
import { selectUser } from '../../store/slices/authSlice';
import { selectDashboardLowStock } from '../../store/slices/dashboardSlice';
import { logoutUser } from '../../store/slices/authSlice';
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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const pageTitle = useBreadcrumb(location.pathname);
  const lowStockCount = lowStock?.length || 0;

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
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

  return (
    <header className="h-16 bg-bg border-b border-border flex items-center px-6 gap-4 flex-shrink-0">
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

        {/* Shop Chip */}
        <div className="hidden sm:flex items-center gap-1.5 bg-navy/5 rounded-xl px-3 py-1.5 border border-border">
          <Store size={13} className="text-grayMid" />
          <span className="text-xs text-grayMid font-medium">
            {user?.shopName || 'All Shops'}
          </span>
        </div>

        {/* User Avatar + Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
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
            {dropdownOpen && (
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
