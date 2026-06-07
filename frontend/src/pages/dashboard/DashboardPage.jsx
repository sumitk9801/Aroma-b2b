import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { getSocket } from '../../utils/socket';
import { useNavigate } from 'react-router-dom';
import {
  Package, TrendingUp, ShoppingCart, Truck, AlertTriangle, Grid3X3,
  Users, Activity, ClipboardList, ShieldCheck, RefreshCcw, DollarSign,
  Plus, Minus, Check, X, Search, Clock, Award, AlertCircle, FileText, Ban
} from 'lucide-react';
import {
  fetchDashboardSummary, fetchRecentSales, fetchTopProducts,
  fetchDashboardLowStock, fetchSalesChart,
  selectDashboardSummary, selectDashboardRecentSales, selectDashboardTopProducts,
  selectDashboardLowStock, selectDashboardSalesChart, selectDashboardLoading,
} from '../../store/slices/dashboardSlice';
import { selectUser, logoutUser } from '../../store/slices/authSlice';
import { selectActiveShopId, selectActiveShopRole, selectActiveShopName } from '../../store/slices/uiSlice';
import { fetchProducts, selectProducts } from '../../store/slices/productsSlice';
import { adjustStock, fetchStockMovements, selectStockMovements } from '../../store/slices/stockMovementsSlice';
import { createSale, fetchSales, selectSales } from '../../store/slices/salesSlice';
import { fetchUsers, selectUsers } from '../../store/slices/usersSlice';
import StatCard from '../../components/ui/StatCard';
import SalesAreaChart from '../../components/charts/SalesAreaChart';
import TopProductsChart from '../../components/charts/TopProductsChart';
import Badge from '../../components/ui/Badge';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import { formatCurrency, formatDate, formatDateOnly } from '../../utils/formatters';
import { cn } from '../../utils/cn';
import { toast } from 'sonner';

const formatRelativeTime = (d) => {
  if (!d) return '—';
  const date = typeof d === 'string' ? new Date(d) : d;
  const now = new Date();
  const diffMs = now - date;
  if (diffMs < 0) return 'Just now';
  const diffSecs = Math.floor(diffMs / 1000);
  if (diffSecs < 60) return 'Just now';
  const diffMins = Math.floor(diffSecs / 60);
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
};

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function DashboardPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const activeShopRole = useSelector(selectActiveShopRole);
  const activeShopName = useSelector(selectActiveShopName);
  const activeShopId = useSelector(selectActiveShopId);
  const user = useSelector(selectUser);

  const userRole = (activeShopRole || user?.role || 'staff').toUpperCase();
  const normalizedRole = userRole === 'STAFF' ? 'INVENTORY_STAFF' : userRole;

  useEffect(() => {
    if (activeShopId) {
      if (normalizedRole === 'ADMIN' || normalizedRole === 'MANAGER') {
        dispatch(fetchDashboardSummary());
        dispatch(fetchRecentSales());
        dispatch(fetchTopProducts());
        dispatch(fetchDashboardLowStock());
        dispatch(fetchSalesChart());
        dispatch(fetchStockMovements());
        dispatch(fetchUsers({ shopId: activeShopId }));
        dispatch(fetchSales({ shopId: activeShopId }));
      }
      if (normalizedRole === 'INVENTORY_STAFF' || normalizedRole === 'CASHIER') {
        dispatch(fetchProducts());
        dispatch(fetchStockMovements());
      }
      if (normalizedRole === 'CASHIER') {
        dispatch(fetchSales({ shopId: activeShopId }));
      }
    }
  }, [dispatch, activeShopId, normalizedRole]);

  // Render correct dashboard
  switch (normalizedRole) {
    case 'ADMIN':
      return <AdminDashboard activeShopName={activeShopName} />;
    case 'MANAGER':
      return <ManagerDashboard activeShopId={activeShopId} activeShopName={activeShopName} />;
    case 'CASHIER':
      return <CashierDashboard activeShopId={activeShopId} activeShopName={activeShopName} />;
    case 'INVENTORY_STAFF':
      return <InventoryStaffDashboard activeShopId={activeShopId} activeShopName={activeShopName} />;
    default:
      return <AdminDashboard activeShopName={activeShopName} />;
  }
}

// ─── 1. ADMIN DASHBOARD ───────────────────────────────────────────────────────
function AdminDashboard({ activeShopName }) {
  const summary = useSelector(selectDashboardSummary);
  const recentSales = useSelector(selectDashboardRecentSales);
  const topProducts = useSelector(selectDashboardTopProducts);
  const lowStock = useSelector(selectDashboardLowStock);
  const salesChart = useSelector(selectDashboardSalesChart);
  const loading = useSelector(selectDashboardLoading);

  const movements = useSelector(selectStockMovements);
  const navigate = useNavigate();

  const auditLogs = useMemo(() => {
    return (movements || []).slice(0, 5).map((m) => {
      let action = 'Stock adjustment';
      let details = m.note || `${m.type === 'addition' ? 'Added' : 'Reduced'} ${m.quantity} units of ${m.product?.name || 'unknown'}`;
      
      if (m.referenceType === 'sale') {
        action = 'Checkout sale recorded';
      } else if (m.referenceType === 'purchase') {
        action = 'Supplier order received';
      } else if (m.referenceType === 'damage') {
        action = 'Damaged inventory reported';
      } else if (m.referenceType === 'receiving') {
        action = 'Stock received';
      }
      
      return {
        id: m.id,
        action,
        details,
        user: m.creator?.name || 'System Admin',
        time: formatRelativeTime(m.createdAt),
      };
    });
  }, [movements]);

  const statCards = [
    { icon: <Package />, title: 'Total Products', value: summary?.totalProducts ?? '—', subtitle: 'In current shop', accent: 'neon' },
    { icon: <TrendingUp />, title: 'Revenue Today', value: formatCurrency(summary?.totalRevenueToday || 0), subtitle: 'vs. yesterday', accent: 'neon' },
    { icon: <ShoppingCart />, title: 'Sales Today', value: summary?.totalSalesToday ?? '—', subtitle: 'Orders processed', accent: 'neon' },
    { icon: <Truck />, title: 'Purchases Today', value: summary?.totalPurchasesToday ?? '—', subtitle: 'Inward stock intake', accent: 'lime' },
    { icon: <AlertTriangle />, title: 'Low Stock Alerts', value: summary?.lowStockCount ?? '—', subtitle: 'Needs restock', accent: (summary?.lowStockCount || 0) > 0 ? 'red' : 'neon' },
    { icon: <Grid3X3 />, title: 'Categories', value: summary?.totalCategories ?? '—', subtitle: 'Active categories', accent: 'lime' },
  ];

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {loading && !summary
          ? [...Array(6)].map((_, i) => <div key={i} className="h-28 bg-white border border-border rounded-2xl animate-pulse" />)
          : statCards.map((card, i) => <StatCard key={i} {...card} />)
        }
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <SalesAreaChart last7Days={salesChart?.last7Days || []} last30Days={salesChart?.last30Days || []} />
        </div>
        <div>
          <TopProductsChart data={topProducts} />
        </div>
      </div>

      {/* Row 3: Recent Sales + Audit Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recent Sales */}
        <div className="lg:col-span-3 card p-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-bg/50">
            <h3 className="font-display font-semibold text-navy">Recent Sales</h3>
          </div>
          {loading && recentSales.length === 0 ? (
            <SkeletonLoader rows={5} cols={4} />
          ) : (
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-bg border-b border-border">
                    {['Customer', 'Items', 'Amount', 'Method', 'Time'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-grayMid uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentSales.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-8 text-gray text-sm">No recent sales</td></tr>
                  ) : (
                    recentSales.map((sale, i) => (
                      <tr key={sale.id || i} className="hover:bg-paleGreen/40 transition-colors">
                        <td className="px-4 py-3 font-medium text-navy">{sale.customerName || 'Walk-in'}</td>
                        <td className="px-4 py-3 text-grayMid">{sale.itemCount || sale.items?.length || '—'}</td>
                        <td className="px-4 py-3 font-semibold text-navy">{formatCurrency(sale.totalAmount || 0)}</td>
                        <td className="px-4 py-3">
                          <Badge variant={sale.paymentMethod?.toLowerCase() || 'other'}>{sale.paymentMethod || 'Other'}</Badge>
                        </td>
                        <td className="px-4 py-3 text-grayMid text-xs">{formatDate(sale.createdAt)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Audit Logs */}
        <div className="lg:col-span-2 card flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4 border-b border-border pb-3">
              <ClipboardList className="text-neon" size={18} />
              <h3 className="font-display font-semibold text-navy">Shop Audit Logs</h3>
            </div>
            <div className="space-y-4">
              {auditLogs.length === 0 ? (
                <p className="text-center text-grayMid text-xs py-8">No recent audit logs available</p>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="flex items-start justify-between text-xs gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-navy truncate">{log.action}</p>
                      <p className="text-grayMid text-[11px] truncate">{log.details}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-navyDeep font-medium">{log.user}</p>
                      <p className="text-grayLight text-[10px]">{log.time}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <button onClick={() => navigate('/inventory/movements')} className="btn-secondary w-full justify-center text-xs mt-4 py-2">
            View Full Audit History
          </button>
        </div>
      </div>

      {/* Low Stock Alerts */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold text-navy flex items-center gap-2">
            <AlertTriangle className="text-red-500" size={16} /> Low Stock Alerts
          </h3>
          {lowStock.length > 0 && <span className="badge-red">{lowStock.length} items</span>}
        </div>
        {lowStock.length === 0 ? (
          <div className="flex items-center gap-3 bg-neon/10 border border-neon/30 rounded-xl px-4 py-3">
            <Check className="text-neon" size={16} />
            <p className="text-navyDeep font-medium text-sm">All stock levels are healthy</p>
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
            {lowStock.map((item, i) => (
              <div key={item.id || i} className="flex-shrink-0 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
                <p className="font-medium text-navy text-sm">{item.name}</p>
                <p className="text-red-600 text-xs mt-0.5">Stock: {item.currentStock} / {item.minimumStock} min</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── 2. MANAGER DASHBOARD ─────────────────────────────────────────────────────
function ManagerDashboard({ activeShopId, activeShopName }) {
  const summary = useSelector(selectDashboardSummary);
  const loading = useSelector(selectDashboardLoading);
  const lowStock = useSelector(selectDashboardLowStock);
  const users = useSelector(selectUsers);
  const sales = useSelector(selectSales);

  const [refunds, setRefunds] = useState([]);
  const [socket, setSocket] = useState(getSocket());

  useEffect(() => {
    if (socket) return;
    const interval = setInterval(() => {
      const s = getSocket();
      if (s) {
        setSocket(s);
        clearInterval(interval);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [socket]);

  useEffect(() => {
    if (!socket) return;

    const handleUpdate = (updatedList) => {
      setRefunds(updatedList);
    };

    socket.on('refund-list-update', handleUpdate);
    socket.emit('join-shop', activeShopId);

    return () => {
      socket.off('refund-list-update', handleUpdate);
    };
  }, [socket, activeShopId]);

  const todaySales = useMemo(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    return (sales || []).filter((s) => new Date(s.createdAt) >= startOfToday);
  }, [sales]);

  const drawerCashBalance = useMemo(() => {
    return todaySales.reduce((acc, s) => acc + (s.totalAmount || 0), 0);
  }, [todaySales]);

  const cashiersList = useMemo(() => {
    const staffMembers = (users || []).filter(u => u.shopRole?.toLowerCase() === 'cashier' || todaySales.some(s => s.createdBy === u.id));
    
    return staffMembers.map((member) => {
      const memberSales = todaySales.filter((s) => s.createdBy === member.id);
      const totalSalesAmt = memberSales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
      
      let status = 'offline';
      let lastActiveText = 'No sales today';
      
      if (memberSales.length > 0) {
        const sortedSales = [...memberSales].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        const lastSaleTime = new Date(sortedSales[0].createdAt);
        const timeDiffMin = Math.floor((new Date() - lastSaleTime) / 60000);
        
        if (timeDiffMin < 60) {
          status = 'active';
          lastActiveText = `Last sale: ${timeDiffMin} min${timeDiffMin !== 1 ? 's' : ''} ago`;
        } else if (timeDiffMin < 240) {
          status = 'break';
          lastActiveText = `Last sale: ${Math.floor(timeDiffMin / 60)}h ago`;
        } else {
          status = 'offline';
          lastActiveText = `Last sale: ${Math.floor(timeDiffMin / 60)}h ago`;
        }
      }
      
      return {
        id: member.id,
        name: member.name,
        salesCount: memberSales.length,
        salesTotal: formatCurrency(totalSalesAmt),
        status,
        lastActiveText
      };
    });
  }, [users, todaySales]);

  const activeCount = cashiersList.filter(c => c.status === 'active').length;
  const cashierStatValue = `${cashiersList.length} Register${cashiersList.length !== 1 ? 's' : ''}`;
  const cashierStatSubtitle = `${activeCount} active, ${cashiersList.length - activeCount} offline/idle`;

  const targetAmount = 15000; // Let's set a target of ₹15,000
  const totalRevenueToday = summary?.totalRevenueToday || 0;
  const targetPercentage = Math.min(100, Math.round((totalRevenueToday / targetAmount) * 100));

  const handleRefund = (id, approved) => {
    const socket = getSocket();
    if (socket && activeShopId) {
      if (approved) {
        socket.emit('approve-refund', { shopId: activeShopId, refundId: id });
      } else {
        socket.emit('reject-refund', { shopId: activeShopId, refundId: id });
      }
    }
  };

  const statCards = [
    { icon: <DollarSign />, title: 'Drawer Cash Balance', value: formatCurrency(drawerCashBalance), subtitle: 'Sum of all active cashiers', accent: 'neon' },
    { icon: <Activity />, title: 'Active Cashiers', value: cashierStatValue, subtitle: cashierStatSubtitle, accent: 'neon' },
    { icon: <AlertTriangle />, title: 'Stock Exceptions', value: lowStock.length, subtitle: 'Below threshold limits', accent: lowStock.length > 0 ? 'red' : 'neon' },
  ];

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statCards.map((card, i) => <StatCard key={i} {...card} />)}
      </div>

      {/* Target Progress & Cashier Monitoring */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Daily sales target progress */}
        <div className="lg:col-span-2 card flex flex-col justify-between">
          <div>
            <h3 className="font-display font-semibold text-navy mb-4">Daily Sales Target</h3>
            <div className="flex flex-col items-center justify-center py-6">
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" stroke="rgba(125, 173, 63, 0.1)" strokeWidth="8" fill="transparent" />
                  <circle cx="50" cy="50" r="40" stroke="#7dad3f" strokeWidth="8" fill="transparent"
                    strokeDasharray={251.2} strokeDashoffset={251.2 - (251.2 * targetPercentage) / 100} strokeLinecap="round" />
                </svg>
                <div className="absolute text-center">
                  <p className="text-2xl font-bold text-navy">{targetPercentage}%</p>
                  <p className="text-[10px] text-grayMid uppercase tracking-wide">Achieved</p>
                </div>
              </div>
              <p className="text-sm font-semibold text-navy mt-4">
                {formatCurrency(totalRevenueToday)} <span className="text-grayLight font-normal">/ {formatCurrency(targetAmount)} target</span>
              </p>
            </div>
          </div>
          <div className="border-t border-border pt-3 text-center">
            <p className="text-xs text-grayMid">Daily targets auto-reset at midnight.</p>
          </div>
        </div>

        {/* Cashier monitoring */}
        <div className="lg:col-span-3 card">
          <div className="flex items-center gap-2 mb-4 border-b border-border pb-3">
            <Activity className="text-neon" size={18} />
            <h3 className="font-display font-semibold text-navy">Cashier Supervision</h3>
          </div>
          <div className="space-y-4">
            {cashiersList.length === 0 ? (
              <p className="text-center text-grayMid text-xs py-8">No cashier registers active</p>
            ) : (
              cashiersList.map((cashier) => (
                <div key={cashier.id} className="flex items-center justify-between border-b border-border pb-3 last:border-b-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      'w-2.5 h-2.5 rounded-full', 
                      cashier.status === 'active' ? 'bg-neon animate-pulse' : cashier.status === 'break' ? 'bg-amber-500' : 'bg-gray-400'
                    )} />
                    <div>
                      <p className="text-sm font-semibold text-navy">{cashier.name}</p>
                      <p className="text-xs text-grayLight">{cashier.lastActiveText}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-navy">{cashier.salesTotal}</p>
                    <p className="text-xs text-grayLight uppercase tracking-wider">{cashier.salesCount} sale{cashier.salesCount !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Refunds and Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Refund Approvals Queue */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4 border-b border-border pb-3">
            <RefreshCcw className="text-neon animate-spin-slow" size={18} />
            <h3 className="font-display font-semibold text-navy">Pending Refund Approvals</h3>
          </div>
          <div className="space-y-3">
            {refunds.length === 0 ? (
              <div className="flex items-center gap-2 text-neon text-sm p-4 bg-neon/5 rounded-xl border border-neon/10">
                <Check size={16} />
                <span>No pending refund requests.</span>
              </div>
            ) : (
              refunds.map((refund) => (
                <div key={refund.id} className="flex items-center justify-between p-3 bg-bg rounded-xl border border-border">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-navy text-sm">{refund.id}</span>
                      <span className="text-red-500 font-bold text-sm">-{formatCurrency(refund.amount)}</span>
                    </div>
                    <p className="text-xs text-grayMid">{refund.items}</p>
                    <p className="text-[10px] text-grayLight">Submitted by {refund.cashier} • {formatRelativeTime(refund.date)}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleRefund(refund.id, false)} className="p-1.5 rounded-lg border border-red-200 text-red-500 bg-white hover:bg-red-50 transition-colors">
                      <X size={14} />
                    </button>
                    <button onClick={() => handleRefund(refund.id, true)} className="p-1.5 rounded-lg border border-neon/20 text-white bg-neon hover:opacity-90 transition-colors">
                      <Check size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Low Stock Watch */}
        <div className="card">
          <h3 className="font-display font-semibold text-navy mb-4 flex items-center gap-2">
            <AlertTriangle className="text-red-500" size={16} /> Stock Level Exceptions
          </h3>
          <div className="space-y-3 max-h-60 overflow-y-auto scrollbar-thin pr-1">
            {lowStock.length === 0 ? (
              <div className="text-sm text-grayMid p-4 bg-bg rounded-xl border border-border">All inventory is fully stocked.</div>
            ) : (
              lowStock.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-2.5 bg-bg rounded-xl border border-border">
                  <p className="text-xs font-semibold text-navy truncate max-w-[200px]">{item.name}</p>
                  <div className="text-right">
                    <p className="text-xs font-bold text-red-600">{item.currentStock} remaining</p>
                    <p className="text-[10px] text-grayLight">Threshold: {item.minimumStock}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── 3. CASHIER DASHBOARD ─────────────────────────────────────────────────────
function CashierDashboard({ activeShopId, activeShopName }) {
  const dispatch = useDispatch();
  const products = useSelector(selectProducts);
  const user = useSelector(selectUser);

  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [submitting, setSubmitting] = useState(false);

  // Refund panel states
  const [rightPanel, setRightPanel] = useState('cart'); // 'cart' or 'refund'
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [refunds, setRefunds] = useState([]);

  const sales = useSelector(selectSales);

  // Shift timer and stats
  const [shiftStart, setShiftStart] = useState(() => {
    const key = user?.id ? `shift_start_${user.id}` : 'shift_start_temp';
    const stored = localStorage.getItem(key);
    if (stored) return new Date(stored);
    const now = new Date();
    localStorage.setItem(key, now.toISOString());
    return now;
  });

  // Sync temp key to user-specific key once user.id is loaded (in case user.id is initially null)
  useEffect(() => {
    if (user?.id) {
      const key = `shift_start_${user.id}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        setShiftStart(new Date(stored));
      } else {
        const tempKey = 'shift_start_temp';
        const tempStored = localStorage.getItem(tempKey);
        const startVal = tempStored ? new Date(tempStored) : new Date();
        localStorage.setItem(key, startVal.toISOString());
        localStorage.removeItem(tempKey);
        setShiftStart(startVal);
      }
    }
  }, [user?.id]);

  const [shiftTime, setShiftTime] = useState('00:00:00');
  const [salesCount, setSalesCount] = useState(0);
  const [salesTotal, setSalesTotal] = useState(0);
  const [closeShiftModal, setCloseShiftModal] = useState(false);

  // Calculate today's sales for this cashier shift
  useEffect(() => {
    if (user?.id) {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const userSalesToday = (sales || []).filter((s) => s.createdBy === user.id && new Date(s.createdAt) >= startOfToday);
      const totalAmount = userSalesToday.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
      setSalesCount(userSalesToday.length);
      setSalesTotal(totalAmount);
    }
  }, [sales, user?.id]);

  // Shift Timer Counter
  useEffect(() => {
    const timer = setInterval(() => {
      const diff = new Date() - shiftStart;
      const hours = String(Math.floor(diff / 3600000)).padStart(2, '0');
      const mins = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
      const secs = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
      setShiftTime(`${hours}:${mins}:${secs}`);
    }, 1000);
    return () => clearInterval(timer);
  }, [shiftStart]);

  // Sync refunds list
  const [socket, setSocket] = useState(getSocket());

  useEffect(() => {
    if (socket) return;
    const interval = setInterval(() => {
      const s = getSocket();
      if (s) {
        setSocket(s);
        clearInterval(interval);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [socket]);

  useEffect(() => {
    if (!socket) return;

    const handleUpdate = (updatedList) => {
      setRefunds(updatedList);
    };

    socket.on('refund-list-update', handleUpdate);
    socket.emit('join-shop', activeShopId);

    return () => {
      socket.off('refund-list-update', handleUpdate);
    };
  }, [socket, activeShopId]);

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products.slice(0, 15);
    const q = searchQuery.toLowerCase();
    return products.filter((p) =>
      p.name?.toLowerCase().includes(q) || p.skuCode?.toLowerCase().includes(q)
    );
  }, [products, searchQuery]);

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, {
        productId: product.id,
        name: product.name,
        unitPrice: product.sellingPrice || 0,
        quantity: 1,
        maxStock: product.currentStock || 0,
      }];
    });
  };

  const updateQty = (productId, delta) => {
    setCart((prev) =>
      prev.map((i) => i.productId === productId
        ? { ...i, quantity: Math.max(1, Math.min(i.maxStock, i.quantity + delta)) }
        : i
      ).filter((i) => i.quantity > 0)
    );
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  };

  const total = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) { toast.error('Cart is empty!'); return; }
    setSubmitting(true);
    const payload = {
      shopId: activeShopId,
      customerName: customerName || undefined,
      paymentMethod,
      items: cart.map(({ productId, quantity, unitPrice }) => ({ productId, quantity, unitPrice })),
    };

    const result = await dispatch(createSale(payload));
    setSubmitting(false);
    if (createSale.fulfilled.match(result)) {
      toast.success('Invoice Created & Printed! ✓');
      dispatch(fetchSales({ shopId: activeShopId }));
      setCart([]);
      setCustomerName('');
    } else {
      toast.error(result.payload || 'Failed to record sale');
    }
  };

  const handleRequestRefund = (amount, items) => {
    const socket = getSocket();
    if (socket && activeShopId) {
      socket.emit('request-refund', {
        shopId: activeShopId,
        cashier: user?.name || 'Cashier',
        amount,
        items
      });
      toast.success('Refund request submitted to manager!');
    } else {
      toast.error('Socket connection offline. Could not submit request.');
    }
  };

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" className="space-y-6">
      {/* Shift Panel Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card flex items-center gap-4 py-4">
          <div className="w-10 h-10 rounded-xl bg-neon/10 flex items-center justify-center text-neon"><Clock size={20} /></div>
          <div>
            <p className="text-[10px] text-grayLight uppercase font-semibold">Active Shift</p>
            <p className="text-lg font-bold font-display text-navy">{shiftTime}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4 py-4">
          <div className="w-10 h-10 rounded-xl bg-neon/10 flex items-center justify-center text-neon"><ShoppingCart size={20} /></div>
          <div>
            <p className="text-[10px] text-grayLight uppercase font-semibold">Shift Transactions</p>
            <p className="text-lg font-bold font-display text-navy">{salesCount} Sales</p>
          </div>
        </div>
        <div className="card flex items-center gap-4 py-4">
          <div className="w-10 h-10 rounded-xl bg-neon/10 flex items-center justify-center text-neon"><DollarSign size={20} /></div>
          <div>
            <p className="text-[10px] text-grayLight uppercase font-semibold">Total Revenue</p>
            <p className="text-lg font-bold font-display text-navy">{formatCurrency(salesTotal)}</p>
          </div>
        </div>
        <button onClick={() => setCloseShiftModal(true)} className="btn-danger w-full justify-center text-base rounded-2xl h-full py-4 font-semibold">
          <Ban size={18} /> Close Shift
        </button>
      </div>

      {/* POS Billing Screen */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Product selector */}
        <div className="lg:col-span-3 space-y-4">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-grayMid" />
            <input
              type="text"
              placeholder="Search POS Products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-base !pl-10"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[460px] overflow-y-auto scrollbar-thin pr-1">
            {filteredProducts.map((product) => {
              const inCart = cart.find((i) => i.productId === product.id);
              const outOfStock = (product.currentStock || 0) === 0;
              return (
                <button
                  key={product.id}
                  onClick={() => !outOfStock && addToCart(product)}
                  disabled={outOfStock}
                  className={cn(
                    'text-left p-3 rounded-2xl border transition-all flex flex-col justify-between h-36',
                    outOfStock
                      ? 'bg-bg border-border opacity-50 cursor-not-allowed'
                      : inCart
                      ? 'border-neon bg-neon/5 ring-1 ring-neon/20'
                      : 'bg-white border-border hover:border-navy/30 card-shadow'
                  )}
                >
                  <div>
                    <p className="text-xs font-semibold text-navy leading-tight line-clamp-2">{product.name}</p>
                    <p className="text-[10px] text-grayLight mt-0.5">SKU: {product.skuCode || '—'}</p>
                  </div>
                  <div className="mt-2 flex justify-between items-end w-full">
                    <span className="text-xs text-neon font-bold">{formatCurrency(product.sellingPrice || 0)}</span>
                    <span className="text-[9px] text-grayMid">Stock: {product.currentStock}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* POS Cart Summary */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card space-y-4">
            {/* Header with Tabs */}
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setRightPanel('cart')}
                  className={cn(
                    'font-display font-semibold text-sm pb-1.5 border-b-2 transition-all',
                    rightPanel === 'cart' ? 'text-navy border-neon' : 'text-grayLight border-transparent'
                  )}
                >
                  Checkout Cart
                </button>
                <button
                  type="button"
                  onClick={() => setRightPanel('refund')}
                  className={cn(
                    'font-display font-semibold text-sm pb-1.5 border-b-2 transition-all',
                    rightPanel === 'refund' ? 'text-navy border-neon' : 'text-grayLight border-transparent'
                  )}
                >
                  Refund Requests
                </button>
              </div>
              {rightPanel === 'cart' && cart.length > 0 && (
                <span className="badge-neon text-[10px]">{cart.length} items</span>
              )}
            </div>

            {rightPanel === 'cart' ? (
              <>
                {/* Cart list */}
                <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-thin">
                  {cart.length === 0 ? (
                    <div className="text-center py-12 text-gray text-xs">
                      <ShoppingCart size={20} className="mx-auto mb-2 text-grayLight" />
                      Select products from the left to start billing.
                    </div>
                  ) : (
                    cart.map((item) => (
                      <div key={item.productId} className="flex items-center gap-2 p-2 bg-bg rounded-xl border border-border">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-navy truncate">{item.name}</p>
                          <p className="text-xs font-bold text-neon">{formatCurrency(item.unitPrice)}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => updateQty(item.productId, -1)} className="w-5.5 h-5.5 rounded bg-white border border-border flex items-center justify-center hover:bg-red-50">
                            <Minus size={8} />
                          </button>
                          <span className="w-5 text-center text-xs font-bold text-navy">{item.quantity}</span>
                          <button onClick={() => updateQty(item.productId, 1)} className="w-5.5 h-5.5 rounded bg-white border border-border flex items-center justify-center hover:bg-neon/20">
                            <Plus size={8} />
                          </button>
                        </div>
                        <button onClick={() => removeFromCart(item.productId)} className="text-grayMid hover:text-red-500 p-1">
                          <X size={12} />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Customer */}
                <input
                  type="text"
                  placeholder="Customer Name (Walk-in)"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="input-base text-xs py-2"
                />

                {/* Payment Method */}
                <div className="grid grid-cols-3 gap-1.5">
                  {['cash', 'card', 'upi'].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod(m)}
                      className={cn(
                        'py-1.5 rounded-lg text-[10px] font-bold uppercase border tracking-wider transition-all',
                        paymentMethod === m ? 'bg-navy text-white border-navy' : 'bg-white border-border text-grayMid'
                      )}
                    >
                      {m}
                    </button>
                  ))}
                </div>

                {/* Total */}
                <div className="border-t border-border pt-3 flex items-center justify-between">
                  <span className="text-xs font-semibold text-grayMid">Total Billing</span>
                  <span className="font-display font-bold text-xl text-neon">{formatCurrency(total)}</span>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={submitting || cart.length === 0}
                  className="btn-primary w-full justify-center py-2.5 text-sm"
                >
                  {submitting ? 'Printing...' : `Collect Payment (${formatCurrency(total)})`}
                </button>
              </>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-grayMid">Ask manager for refund permission</span>
                  <button
                    type="button"
                    onClick={() => setRefundModalOpen(true)}
                    className="btn-primary !py-1.5 !px-3 text-xs flex items-center gap-1"
                  >
                    <Plus size={12} /> New Request
                  </button>
                </div>

                {/* List of active requests */}
                <div className="space-y-2 max-h-72 overflow-y-auto scrollbar-thin">
                  {refunds.length === 0 ? (
                    <div className="text-center py-12 text-gray text-xs">
                      <RefreshCcw size={20} className="mx-auto mb-2 text-grayLight animate-spin-slow" />
                      No active refund requests in this shop.
                    </div>
                  ) : (
                    refunds.map((refund) => (
                      <div key={refund.id} className="p-3 bg-bg rounded-xl border border-border space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-navy text-sm">{refund.id}</span>
                          <span className="text-red-500 font-bold text-sm">-{formatCurrency(refund.amount)}</span>
                        </div>
                        <p className="text-xs text-grayMid">{refund.items}</p>
                        <div className="flex items-center justify-between mt-1 text-[10px]">
                          <span className="text-grayLight">Requested by {refund.cashier} • {formatRelativeTime(refund.date)}</span>
                          <span className="flex items-center gap-1 text-amber-600 font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            Pending Approval
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Close Shift Modal */}
      <CloseShiftModal isOpen={closeShiftModal} onClose={() => setCloseShiftModal(false)} shiftTime={shiftTime} salesCount={salesCount} salesTotal={salesTotal} />

      {/* Request Refund Modal */}
      <RequestRefundModal isOpen={refundModalOpen} onClose={() => setRefundModalOpen(false)} onSubmit={handleRequestRefund} />
    </motion.div>
  );
}

// MOCK SHIFT CLOSE MODAL
function CloseShiftModal({ isOpen, onClose, shiftTime, salesCount, salesTotal }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const [drawerCash, setDrawerCash] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(async () => {
      setSubmitting(false);
      if (user?.id) {
        localStorage.removeItem(`shift_start_${user.id}`);
      }
      localStorage.removeItem('shift_start_temp');
      
      // Dispatch logout to clear state and tokens
      await dispatch(logoutUser());
      
      toast.success(`Shift closed successfully! Actual Cash: ₹${drawerCash}. Logged out.`);
      onClose();
      navigate('/login');
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-navyDeep/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-border w-full max-w-md p-6 relative">
        <h3 className="text-lg font-display font-bold text-navy mb-1 flex items-center gap-2">
          <AlertCircle className="text-red-500" size={18} /> Close Cashier Shift
        </h3>
        <p className="text-xs text-grayMid mb-4">Complete shift details and tally the drawer balance.</p>

        <div className="bg-bg border border-border rounded-2xl p-4 mb-4 space-y-2.5 text-xs text-navy font-semibold">
          <div className="flex justify-between">
            <span className="text-grayMid">Shift Duration</span>
            <span>{shiftTime}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-grayMid">Total Shift Invoices</span>
            <span>{salesCount} Sales</span>
          </div>
          <div className="flex justify-between">
            <span className="text-grayMid">Expected Revenue</span>
            <span className="text-neon">{formatCurrency(salesTotal)}</span>
          </div>
          <div className="flex justify-between border-t border-border pt-2">
            <span className="text-grayMid">Opening Cash Float</span>
            <span>$100.00</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-navy mb-1">Actual Cash in Drawer (₹)</label>
            <input
              type="number"
              required
              value={drawerCash}
              onChange={(e) => setDrawerCash(e.target.value)}
              placeholder="Enter counted cash drawer amount"
              className="input-base text-sm"
              step="0.01"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center py-2 text-xs">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn-danger flex-1 justify-center py-2 text-xs font-semibold">
              {submitting ? 'Compiling...' : 'Confirm & Close'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// REQUEST REFUND MODAL
function RequestRefundModal({ isOpen, onClose, onSubmit }) {
  const [amount, setAmount] = useState('');
  const [items, setItems] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (!items.trim()) {
      toast.error('Please specify the items to refund');
      return;
    }
    onSubmit(parsedAmount, items.trim());
    setAmount('');
    setItems('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-navyDeep/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-border w-full max-w-md p-6 relative">
        <h3 className="text-lg font-display font-bold text-navy mb-1 flex items-center gap-2">
          <RefreshCcw className="text-neon animate-spin-slow" size={18} /> Request Refund Approval
        </h3>
        <p className="text-xs text-grayMid mb-4">Send a real-time request to the shop manager for verification.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-navy mb-1 font-display">Refund Amount (₹)</label>
            <input
              type="number"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 45"
              className="input-base text-sm font-semibold"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-navy mb-1 font-display">Items / Reason</label>
            <textarea
              required
              value={items}
              onChange={(e) => setItems(e.target.value)}
              placeholder="e.g. Aroma Perfume Oil x1 (Expired packaging)"
              className="input-base text-sm min-h-[80px] py-2"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center py-2 text-xs">
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1 justify-center py-2 text-xs font-semibold">
              Submit Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── 4. INVENTORY STAFF DASHBOARD ──────────────────────────────────────────────
function InventoryStaffDashboard({ activeShopId, activeShopName }) {
  const dispatch = useDispatch();
  const products = useSelector(selectProducts);
  const movements = useSelector(selectStockMovements);

  const [searchQuery, setSearchQuery] = useState('');
  const [damageProduct, setDamageProduct] = useState('');
  const [damageQty, setDamageQty] = useState('');
  const [damageReason, setDamageReason] = useState('Damaged Packaging');
  const [submittingDamage, setSubmittingDamage] = useState(false);

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products.slice(0, 10);
    const q = searchQuery.toLowerCase();
    return products.filter((p) =>
      p.name?.toLowerCase().includes(q) || p.skuCode?.toLowerCase().includes(q)
    );
  }, [products, searchQuery]);

  const handleStockUpdate = async (productId, delta) => {
    const payload = {
      shopId: activeShopId,
      productId,
      type: delta > 0 ? 'addition' : 'reduction',
      quantity: Math.abs(delta),
      reason: 'Quick update from Inventory Dashboard',
      referenceType: 'manual',
    };
    const result = await dispatch(adjustStock(payload));
    if (adjustStock.fulfilled.match(result)) {
      toast.success('Stock adjusted! ✓');
      dispatch(fetchProducts());
      dispatch(fetchStockMovements());
    } else {
      toast.error(result.payload || 'Failed to update stock');
    }
  };

  const handleDamageReport = async (e) => {
    e.preventDefault();
    if (!damageProduct) { toast.error('Select a product'); return; }
    if (!damageQty || Number(damageQty) <= 0) { toast.error('Enter valid quantity'); return; }

    setSubmittingDamage(true);
    const payload = {
      shopId: activeShopId,
      productId: damageProduct,
      type: 'reduction',
      quantity: Number(damageQty),
      reason: `Damage Intake: ${damageReason}`,
      referenceType: 'damage',
    };
    const result = await dispatch(adjustStock(payload));
    setSubmittingDamage(false);
    if (adjustStock.fulfilled.match(result)) {
      toast.success('Damaged inventory recorded! ✓');
      dispatch(fetchProducts());
      dispatch(fetchStockMovements());
      setDamageProduct('');
      setDamageQty('');
    } else {
      toast.error(result.payload || 'Failed to report damage');
    }
  };

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" className="space-y-6">
      {/* Search and Quick Edit Table */}
      <div className="card p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-bg/50">
          <div>
            <h3 className="font-display font-semibold text-navy">Inventory Stock Operations</h3>
            <p className="text-xs text-grayMid mt-0.5">Quickly increment or decrement stock counts</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-grayMid" />
            <input
              type="text"
              placeholder="Search inventory..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-base !pl-9 text-xs py-1.5"
            />
          </div>
        </div>

        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-bg border-b border-border">
                {['Product Name', 'SKU Code', 'Min Limit', 'Current Stock', 'Quick Action'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-grayMid uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredProducts.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray text-sm">No products found</td></tr>
              ) : (
                filteredProducts.map((p) => {
                  const isLow = (p.currentStock || 0) <= (p.minimumStock || 0);
                  return (
                    <tr key={p.id} className="hover:bg-bg transition-colors">
                      <td className="px-4 py-3 font-semibold text-navy">{p.name}</td>
                      <td className="px-4 py-3 text-grayMid text-xs">{p.skuCode || '—'}</td>
                      <td className="px-4 py-3 text-grayMid">{p.minimumStock}</td>
                      <td className="px-4 py-3">
                        <span className={cn('font-bold', isLow ? 'text-red-500' : 'text-navy')}>
                          {p.currentStock}
                        </span>
                        {isLow && <span className="ml-1 px-1.5 py-0.5 bg-red-100 text-red-700 text-[9px] rounded-full uppercase tracking-wider font-bold">Low</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          <button onClick={() => handleStockUpdate(p.id, -1)} className="p-1 rounded bg-red-50 text-red-500 border border-red-200 hover:bg-red-100 transition-all">
                            <Minus size={12} />
                          </button>
                          <button onClick={() => handleStockUpdate(p.id, 1)} className="p-1 rounded bg-neon/10 text-neon border border-neon/20 hover:bg-neon/20 transition-all">
                            <Plus size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Damaged Stock Form */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center gap-2 mb-4 border-b border-border pb-3">
            <AlertCircle className="text-red-500" size={16} />
            <h3 className="font-display font-semibold text-navy">Record Damaged Inventory</h3>
          </div>

          <form onSubmit={handleDamageReport} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-navy mb-1">Product</label>
              <select value={damageProduct} onChange={(e) => setDamageProduct(e.target.value)} className="input-base text-xs py-2">
                <option value="">Select damaged item</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name} (Stock: {p.currentStock})</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy mb-1">Damaged Quantity</label>
              <input
                type="number"
                value={damageQty}
                onChange={(e) => setDamageQty(e.target.value)}
                placeholder="Number of damaged items"
                className="input-base text-xs py-2"
                min="1"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy mb-1">Damage Reason</label>
              <select value={damageReason} onChange={(e) => setDamageReason(e.target.value)} className="input-base text-xs py-2">
                <option value="Damaged Packaging">Damaged Packaging</option>
                <option value="Water/Liquid Damage">Water/Liquid Damage</option>
                <option value="Expired Product">Expired Product</option>
                <option value="Incorrect Shipment Intake">Incorrect Shipment Intake</option>
                <option value="Other">Other Exception</option>
              </select>
            </div>

            <button type="submit" disabled={submittingDamage || !damageProduct || !damageQty} className="btn-primary w-full justify-center text-xs py-2">
              {submittingDamage ? 'Submitting...' : 'File Damage Report'}
            </button>
          </form>
        </div>

        {/* Recent stock movements */}
        <div className="lg:col-span-3 card">
          <div className="flex items-center gap-2 mb-4 border-b border-border pb-3">
            <ClipboardList className="text-neon" size={16} />
            <h3 className="font-display font-semibold text-navy">Stock Movement Logs</h3>
          </div>
          <div className="space-y-3.5 max-h-72 overflow-y-auto scrollbar-thin pr-1">
            {movements.length === 0 ? (
              <div className="text-xs text-grayMid p-4 bg-bg rounded-xl border border-border">No stock movements logged.</div>
            ) : (
              movements.slice(0, 10).map((log, i) => {
                const isAddition = log.type === 'addition';
                return (
                  <div key={log.id || i} className="flex items-center justify-between text-xs border-b border-border pb-2 last:border-b-0 last:pb-0">
                    <div>
                      <p className="font-semibold text-navy">{log.product?.name || 'Unknown Product'}</p>
                      <p className="text-[10px] text-grayLight uppercase tracking-wider">{log.referenceType} • {log.note || 'Manual edit'}</p>
                    </div>
                    <div className="text-right">
                      <span className={cn('font-bold', isAddition ? 'text-neon' : 'text-red-500')}>
                        {isAddition ? '+' : '-'}{log.quantity}
                      </span>
                      <p className="text-[9px] text-grayLight">{formatDate(log.createdAt)}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
