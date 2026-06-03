import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../store/slices/authSlice';
import { selectActiveShopRole } from '../store/slices/uiSlice';

export default function AdminOnlyRoute() {
  const user = useSelector(selectUser);
  const activeShopRole = useSelector(selectActiveShopRole);

  const userRole = (activeShopRole || user?.role || 'staff').toUpperCase();
  const normalizedRole = userRole === 'STAFF' ? 'INVENTORY_STAFF' : userRole;

  const isAdmin = normalizedRole === 'ADMIN';

  return isAdmin ? <Outlet /> : <Navigate to="/dashboard" replace />;
}
