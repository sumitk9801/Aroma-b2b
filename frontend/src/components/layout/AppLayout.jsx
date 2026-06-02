import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectMobileMenuOpen, setMobileMenuOpen } from '../../store/slices/uiSlice';
import { fetchShops } from '../../store/slices/shopsSlice';
import { selectIsAuthenticated } from '../../store/slices/authSlice';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

export default function AppLayout() {
  const dispatch = useDispatch();
  const mobileMenuOpen = useSelector(selectMobileMenuOpen);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  // Load the admin's shops on app boot — this also auto-sets the active shop
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchShops());
    }
  }, [dispatch, isAuthenticated]);

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      {/* Backdrop for Mobile Sidebar Drawer */}
      {mobileMenuOpen && (
        <div
          onClick={() => dispatch(setMobileMenuOpen(false))}
          className="fixed inset-0 bg-navyDeep/40 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300"
        />
      )}

      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-6 scrollbar-thin">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
