import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../store/slices/authSlice';
import { selectActiveShopRole } from '../store/slices/uiSlice';

/**
 * RoleRoute — restricts access to a set of allowed roles.
 * Usage: <RoleRoute allow={['ADMIN', 'MANAGER', 'INVENTORY_STAFF']} />
 * Redirects to /dashboard if the current user's role is not in the allow list.
 */
export default function RoleRoute({ allow = [] }) {
  const user = useSelector(selectUser);
  const activeShopRole = useSelector(selectActiveShopRole);

  const rawRole = (activeShopRole || user?.role || 'staff').toUpperCase();
  const role = rawRole === 'STAFF' ? 'INVENTORY_STAFF' : rawRole;

  const normalizedAllow = allow.map((r) => r.toUpperCase());
  const allowed = normalizedAllow.includes(role);

  return allowed ? <Outlet /> : <Navigate to="/dashboard" replace />;
}
