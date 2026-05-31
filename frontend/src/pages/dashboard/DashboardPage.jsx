import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import {
  Package, TrendingUp, ShoppingCart, Truck, AlertTriangle, Grid3X3
} from 'lucide-react';
import {
  fetchDashboardSummary, fetchRecentSales, fetchTopProducts,
  fetchDashboardLowStock, fetchSalesChart,
  selectDashboardSummary, selectDashboardRecentSales, selectDashboardTopProducts,
  selectDashboardLowStock, selectDashboardSalesChart, selectDashboardLoading,
} from '../../store/slices/dashboardSlice';
import StatCard from '../../components/ui/StatCard';
import SalesAreaChart from '../../components/charts/SalesAreaChart';
import TopProductsChart from '../../components/charts/TopProductsChart';
import Badge from '../../components/ui/Badge';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { cn } from '../../utils/cn';

const containerVariants = {
  animate: { transition: { staggerChildren: 0.07 } },
};

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

export default function DashboardPage() {
  const dispatch = useDispatch();
  const summary = useSelector(selectDashboardSummary);
  const recentSales = useSelector(selectDashboardRecentSales);
  const topProducts = useSelector(selectDashboardTopProducts);
  const lowStock = useSelector(selectDashboardLowStock);
  const salesChart = useSelector(selectDashboardSalesChart);
  const loading = useSelector(selectDashboardLoading);

  useEffect(() => {
    dispatch(fetchDashboardSummary());
    dispatch(fetchRecentSales());
    dispatch(fetchTopProducts());
    dispatch(fetchDashboardLowStock());
    dispatch(fetchSalesChart());
  }, [dispatch]);

  const statCards = [
    {
      icon: <Package />, title: 'Total Products',
      value: summary?.totalProducts ?? '—',
      trend: '+3', trendDirection: 'up', subtitle: 'Across all shops', accent: 'neon',
    },
    {
      icon: <TrendingUp />, title: 'Revenue Today',
      value: formatCurrency(summary?.totalRevenueToday || 0),
      trend: '+8.2%', trendDirection: 'up', subtitle: 'vs. yesterday', accent: 'neon',
    },
    {
      icon: <ShoppingCart />, title: 'Sales Today',
      value: summary?.totalSalesToday ?? '—',
      trend: '+2', trendDirection: 'up', subtitle: 'Orders placed', accent: 'neon',
    },
    {
      icon: <Truck />, title: 'Purchases Today',
      value: summary?.totalPurchasesToday ?? '—',
      trend: null, subtitle: 'Restocking activity', accent: 'lime',
    },
    {
      icon: <AlertTriangle />, title: 'Low Stock Alerts',
      value: summary?.lowStockCount ?? '—',
      trend: null, subtitle: 'Items below minimum',
      accent: (summary?.lowStockCount || 0) > 0 ? 'red' : 'neon',
    },
    {
      icon: <Grid3X3 />, title: 'Categories',
      value: summary?.totalCategories ?? '—',
      trend: null, subtitle: 'Product categories', accent: 'lime',
    },
  ];

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" className="space-y-6">

      {/* Stat Cards */}
      <motion.div
        variants={containerVariants}
        initial="initial"
        animate="animate"
        className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4"
      >
        {loading && !summary
          ? [...Array(6)].map((_, i) => (
            <div key={i} className="h-28 bg-white border border-border rounded-2xl animate-pulse" />
          ))
          : statCards.map((card, i) => (
            <StatCard key={i} {...card} />
          ))
        }
      </motion.div>

      {/* Sales Area Chart */}
      <SalesAreaChart
        last7Days={salesChart?.last7Days || []}
        last30Days={salesChart?.last30Days || []}
      />

      {/* Row 3: Recent Sales + Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recent Sales Table */}
        <div className="lg:col-span-3 card p-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
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
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-grayMid uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentSales.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-gray text-sm">No recent sales</td>
                    </tr>
                  ) : (
                    recentSales.map((sale, i) => (
                      <motion.tr
                        key={sale.id || i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className="hover:bg-paleGreen/40 transition-colors"
                      >
                        <td className="px-4 py-3 font-medium text-navy">
                          {sale.customerName || 'Walk-in'}
                        </td>
                        <td className="px-4 py-3 text-grayMid">
                          {sale.itemCount || sale.items?.length || '—'}
                        </td>
                        <td className="px-4 py-3 font-semibold text-navy">
                          {formatCurrency(sale.totalAmount || 0)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={sale.paymentMethod?.toLowerCase() || 'other'}>
                            {sale.paymentMethod || 'Other'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-grayMid text-xs">
                          {formatDate(sale.createdAt)}
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Top Products Chart */}
        <div className="lg:col-span-2">
          <TopProductsChart data={topProducts} />
        </div>
      </div>

      {/* Low Stock Alerts Row */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold text-navy">Low Stock Alerts</h3>
          {lowStock.length > 0 && (
            <span className="bg-red-50 text-red-600 text-xs font-semibold px-2.5 py-1 rounded-full border border-red-200">
              {lowStock.length} items
            </span>
          )}
        </div>

        {lowStock.length === 0 ? (
          <div className="flex items-center gap-3 bg-neon/10 border border-neon/30 rounded-xl px-4 py-3">
            <span className="text-2xl">✓</span>
            <p className="text-navyDeep font-medium text-sm">All stock levels are healthy</p>
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
            {lowStock.map((item, i) => (
              <motion.div
                key={item.id || i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="flex-shrink-0 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5"
              >
                <p className="font-medium text-navy text-sm">{item.name}</p>
                <p className="text-red-600 text-xs mt-0.5">
                  {item.currentStock} / {item.minimumStock} min
                </p>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
