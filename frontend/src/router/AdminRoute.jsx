import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAdmin } from '../store/slices/authSlice';

export default function AdminRoute() {
  const isAdmin = useSelector(selectIsAdmin);
  return isAdmin ? <Outlet /> : <Navigate to="/dashboard" replace />;
}
