import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated, selectAuth } from '../store/slices/authSlice';
import PageSkeleton from '../components/layout/PageSkeleton';

export default function ProtectedRoute() {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const { loading } = useSelector(selectAuth);

  // Still bootstrapping auth from localStorage token
  if (loading) return <PageSkeleton />;

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}
