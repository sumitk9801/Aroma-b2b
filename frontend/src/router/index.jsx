import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import AdminRoute from './AdminRoute';
import AdminOnlyRoute from './AdminOnlyRoute';
import RoleRoute from './RoleRoute';
import AppLayout from '../components/layout/AppLayout';
import PageSkeleton from '../components/layout/PageSkeleton';

// ─── Lazy-loaded pages ────────────────────────────────────────────────────────
const LoginPage              = lazy(() => import('../pages/auth/LoginPage'));
const RegisterPage           = lazy(() => import('../pages/auth/RegisterPage'));
const SelectShopPage         = lazy(() => import('../pages/auth/SelectShopPage'));
const DashboardPage          = lazy(() => import('../pages/dashboard/DashboardPage'));

// Products
const ProductsPage           = lazy(() => import('../pages/products/ProductsPage'));
const ProductRequestsPage    = lazy(() => import('../pages/products/ProductRequestsPage'));
const NewProductRequestPage  = lazy(() => import('../pages/products/NewProductRequestPage'));

// Inventory
const StockMovementsPage     = lazy(() => import('../pages/inventory/StockMovementsPage'));
const LowStockPage           = lazy(() => import('../pages/inventory/LowStockPage'));
const StockAdjustPage        = lazy(() => import('../pages/inventory/StockAdjustPage'));
const StockReceivingPage     = lazy(() => import('../pages/inventory/StockReceivingPage'));
const NewStockReceivingPage  = lazy(() => import('../pages/inventory/NewStockReceivingPage'));

// Sales
const SalesPage              = lazy(() => import('../pages/sales/SalesPage'));
const NewSalePage            = lazy(() => import('../pages/sales/NewSalePage'));
const SaleDetailPage         = lazy(() => import('../pages/sales/SaleDetailPage'));

// Purchases (Admin + Manager only)
const PurchasesPage          = lazy(() => import('../pages/purchases/PurchasesPage'));
const NewPurchasePage        = lazy(() => import('../pages/purchases/NewPurchasePage'));
const PurchaseDetailPage     = lazy(() => import('../pages/purchases/PurchaseDetailPage'));

// Misc
const CategoriesPage         = lazy(() => import('../pages/categories/CategoriesPage'));
const ShopsPage              = lazy(() => import('../pages/shops/ShopsPage'));
const ReportsPage            = lazy(() => import('../pages/reports/ReportsPage'));
const UsersPage              = lazy(() => import('../pages/users/UsersPage'));

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageSkeleton />}>
        <Routes>
          {/* ── Public ─────────────────────────────────────────────────────── */}
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* ── Protected (must be logged in) ──────────────────────────────── */}
          <Route element={<ProtectedRoute />}>
            <Route path="/select-shop" element={<SelectShopPage />} />

            <Route element={<AppLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />

              {/* ── All inventory & warehouse roles ─────────────────────────── */}
              <Route element={<RoleRoute allow={['ADMIN', 'MANAGER', 'INVENTORY_STAFF']} />}>
                <Route path="/products"              element={<ProductsPage />} />
                <Route path="/products/requests"     element={<ProductRequestsPage />} />
                <Route path="/products/requests/new" element={<NewProductRequestPage />} />
                <Route path="/inventory/movements"   element={<StockMovementsPage />} />
                <Route path="/inventory/low-stock"   element={<LowStockPage />} />
                <Route path="/inventory/adjust"      element={<StockAdjustPage />} />
                <Route path="/inventory/receiving"   element={<StockReceivingPage />} />
                <Route path="/inventory/receiving/new" element={<NewStockReceivingPage />} />
                <Route path="/categories"            element={<CategoriesPage />} />
              </Route>

              {/* ── Sales roles: Admin, Manager, Cashier ───────────────────── */}
              <Route element={<RoleRoute allow={['ADMIN', 'MANAGER', 'CASHIER']} />}>
                <Route path="/sales"     element={<SalesPage />} />
                <Route path="/sales/new" element={<NewSalePage />} />
                <Route path="/sales/:id" element={<SaleDetailPage />} />
              </Route>

              {/* ── Admin + Manager only ─────────────────────────────────────  */}
              <Route element={<AdminRoute />}>
                <Route path="/users"          element={<UsersPage />} />
                <Route path="/purchases"      element={<PurchasesPage />} />
                <Route path="/purchases/new"  element={<NewPurchasePage />} />
                <Route path="/purchases/:id"  element={<PurchaseDetailPage />} />
              </Route>

              {/* ── Admin only ───────────────────────────────────────────────  */}
              <Route element={<AdminOnlyRoute />}>
                <Route path="/shops"   element={<ShopsPage />} />
                <Route path="/reports" element={<ReportsPage />} />
              </Route>
            </Route>
          </Route>

          {/* ── Catch-all ──────────────────────────────────────────────────── */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
