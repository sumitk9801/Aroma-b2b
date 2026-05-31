import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import AdminRoute from './AdminRoute';
import AppLayout from '../components/layout/AppLayout';
import PageSkeleton from '../components/layout/PageSkeleton';

// Lazy-loaded pages
const LoginPage         = lazy(() => import('../pages/auth/LoginPage'));
const RegisterPage      = lazy(() => import('../pages/auth/RegisterPage'));
const DashboardPage     = lazy(() => import('../pages/dashboard/DashboardPage'));
const ProductsPage      = lazy(() => import('../pages/products/ProductsPage'));
const StockMovementsPage = lazy(() => import('../pages/inventory/StockMovementsPage'));
const LowStockPage      = lazy(() => import('../pages/inventory/LowStockPage'));
const StockAdjustPage   = lazy(() => import('../pages/inventory/StockAdjustPage'));
const SalesPage         = lazy(() => import('../pages/sales/SalesPage'));
const NewSalePage       = lazy(() => import('../pages/sales/NewSalePage'));
const SaleDetailPage    = lazy(() => import('../pages/sales/SaleDetailPage'));
const PurchasesPage     = lazy(() => import('../pages/purchases/PurchasesPage'));
const NewPurchasePage   = lazy(() => import('../pages/purchases/NewPurchasePage'));
const PurchaseDetailPage = lazy(() => import('../pages/purchases/PurchaseDetailPage'));
const CategoriesPage    = lazy(() => import('../pages/categories/CategoriesPage'));
const ShopsPage         = lazy(() => import('../pages/shops/ShopsPage'));
const ReportsPage       = lazy(() => import('../pages/reports/ReportsPage'));
const UsersPage         = lazy(() => import('../pages/users/UsersPage'));

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageSkeleton />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected App Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard"            element={<DashboardPage />} />
              <Route path="/products"             element={<ProductsPage />} />
              <Route path="/inventory/movements"  element={<StockMovementsPage />} />
              <Route path="/inventory/low-stock"  element={<LowStockPage />} />
              <Route path="/inventory/adjust"     element={<StockAdjustPage />} />
              <Route path="/sales"                element={<SalesPage />} />
              <Route path="/sales/new"            element={<NewSalePage />} />
              <Route path="/sales/:id"            element={<SaleDetailPage />} />
              <Route path="/purchases"            element={<PurchasesPage />} />
              <Route path="/purchases/new"        element={<NewPurchasePage />} />
              <Route path="/purchases/:id"        element={<PurchaseDetailPage />} />
              <Route path="/categories"           element={<CategoriesPage />} />
              <Route path="/shops"                element={<ShopsPage />} />
              <Route path="/reports"              element={<ReportsPage />} />

              {/* Admin Only */}
              <Route element={<AdminRoute />}>
                <Route path="/users" element={<UsersPage />} />
              </Route>
            </Route>
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
