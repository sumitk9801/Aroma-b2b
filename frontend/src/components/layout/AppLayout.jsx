import React, { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectMobileMenuOpen, setMobileMenuOpen, selectActiveShopId } from '../../store/slices/uiSlice';
import { fetchShops, selectShops, selectShopsLoading } from '../../store/slices/shopsSlice';
import { selectIsAuthenticated } from '../../store/slices/authSlice';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { useRefundSocket } from '../../utils/socket';

export default function AppLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const mobileMenuOpen = useSelector(selectMobileMenuOpen);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const shops = useSelector(selectShops);
  const activeShopId = useSelector(selectActiveShopId);
  const loadingShops = useSelector(selectShopsLoading);

  useRefundSocket();

  // Load the admin's shops on app boot — this also auto-sets the active shop
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchShops());
    }
  }, [dispatch, isAuthenticated]);

  // If user belongs to multiple shops and has not selected one, redirect to /select-shop
  useEffect(() => {
    if (isAuthenticated && !loadingShops && shops.length > 1 && !activeShopId) {
      navigate('/select-shop');
    }
  }, [isAuthenticated, loadingShops, shops, activeShopId, navigate]);

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
