import {
  LayoutDashboard,
  Package,
  Warehouse,
  ArrowLeftRight,
  AlertTriangle,
  SlidersHorizontal,
  ShoppingCart,
  Truck,
  Grid3X3,
  Store,
  BarChart3,
  Users,
} from 'lucide-react';

// ─── Navigation ──────────────────────────────────────────────────────────────
export const NAV_ITEMS = [
  { label: 'Dashboard',  icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Products',   icon: Package,         path: '/products' },
  {
    label: 'Inventory',
    icon: Warehouse,
    path: null,
    children: [
      { label: 'Stock Movements', icon: ArrowLeftRight,    path: '/inventory/movements' },
      { label: 'Low Stock',       icon: AlertTriangle,     path: '/inventory/low-stock' },
      { label: 'Adjust Stock',    icon: SlidersHorizontal, path: '/inventory/adjust' },
    ],
  },
  { label: 'Sales',      icon: ShoppingCart, path: '/sales' },
  { label: 'Purchases',  icon: Truck,        path: '/purchases' },
  { label: 'Categories', icon: Grid3X3,      path: '/categories' },
  { label: 'Shops',      icon: Store,        path: '/shops' },
  { label: 'Reports',    icon: BarChart3,    path: '/reports' },
  { label: 'Users',      icon: Users,        path: '/users', adminOnly: true },
];

// ─── Payment Methods ──────────────────────────────────────────────────────────
export const PAYMENT_METHODS = [
  { value: 'cash',   label: 'Cash' },
  { value: 'card',   label: 'Card' },
  { value: 'upi',    label: 'UPI' },
  { value: 'other',  label: 'Other' },
];

// ─── Stock Movement Reference Types ──────────────────────────────────────────
export const REFERENCE_TYPES = [
  { value: 'manual',     label: 'Manual' },
  { value: 'correction', label: 'Correction' },
  { value: 'damage',     label: 'Damage' },
  { value: 'return',     label: 'Return' },
];

// ─── User Roles ───────────────────────────────────────────────────────────────
export const USER_ROLES = [
  { value: 'admin',    label: 'Admin' },
  { value: 'customer', label: 'Customer' },
];

// ─── Report Intervals ────────────────────────────────────────────────────────
export const REPORT_INTERVALS = [
  { value: 'daily',   label: 'Daily' },
  { value: 'weekly',  label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly',  label: 'Yearly' },
];

// ─── Pagination ───────────────────────────────────────────────────────────────
export const PAGE_SIZE = 20;

// ─── Stock movement types ─────────────────────────────────────────────────────
export const MOVEMENT_TYPES = [
  { value: '',          label: 'All Types' },
  { value: 'addition',  label: 'Addition' },
  { value: 'reduction', label: 'Reduction' },
];

// ─── Local Storage Keys ───────────────────────────────────────────────────────
export const LS_TOKEN_KEY  = 'aroma_token';
export const LS_USER_KEY   = 'aroma_user';
export const LS_REFRESH_TOKEN_KEY = 'aroma_refresh_token';

// ─── Chart Colors ─────────────────────────────────────────────────────────────
export const CHART_COLORS = {
  neon:  '#B8ED23',
  lime:  '#C1F42F',
  navy:  '#1B1946',
  paleGreen: '#DFF09F',
  red:   '#ef4444',
  amber: '#f59e0b',
};
