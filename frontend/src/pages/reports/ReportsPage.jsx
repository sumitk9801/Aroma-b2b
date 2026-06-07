import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import {
  BarChart2, TrendingUp, Package, Zap, AlertOctagon, Users, RefreshCw, History, Calendar, Filter
} from 'lucide-react';
import {
  fetchSalesSummary, fetchPurchaseSummary, fetchProfitSummary,
  fetchStockValuation, fetchDeadStock, fetchFastMovingProducts,
  fetchSalesByDateRange, fetchMyTransactions, fetchProductOrderFrequency,
  fetchTopCustomers, fetchInventoryTurnover, fetchStockRestoredSummary,
  fetchMonthlyComparison, selectReports, selectReportsLoading
} from '../../store/slices/reportsSlice';
import { selectUser } from '../../store/slices/authSlice';
import { selectActiveShopRole } from '../../store/slices/uiSlice';
import PageHeader from '../../components/ui/PageHeader';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import DataTable from '../../components/ui/DataTable';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, Cell, AreaChart, Area } from 'recharts';
import { formatCurrency, formatNumber, formatDate, formatDateOnly, formatPercent } from '../../utils/formatters';
import { REPORT_INTERVALS } from '../../utils/constants';
import { cn } from '../../utils/cn';

const pageVariants = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

const MetricCard = ({ label, value, subvalue, accent = false }) => (
  <div className={cn('card transition-all duration-200 hover:shadow-md', accent && 'border-neon/30 bg-neon/5')}>
    <p className="text-xs text-grayMid font-medium uppercase tracking-wide mb-2">{label}</p>
    <p className={cn('font-display font-bold text-2xl', accent ? 'text-navyDeep' : 'text-navy')}>{value ?? '—'}</p>
    {subvalue && <p className="text-gray text-xs mt-1">{subvalue}</p>}
  </div>
);

export default function ReportsPage() {
  const dispatch = useDispatch();
  const reports = useSelector(selectReports);
  const loading = useSelector(selectReportsLoading);
  
  const user = useSelector(selectUser);
  const activeShopRole = useSelector(selectActiveShopRole);
  
  const userRole = (activeShopRole || user?.role || 'staff').toUpperCase();
  const normalizedRole = userRole === 'STAFF' ? 'INVENTORY_STAFF' : userRole;

  // Determine tabs based on role
  const availableTabs = [];
  if (normalizedRole === 'ADMIN') {
    availableTabs.push(
      { key: 'sales',       label: 'Sales',       icon: TrendingUp },
      { key: 'purchase',    label: 'Purchases',   icon: BarChart2 },
      { key: 'profit',      label: 'Profit & KPIs', icon: Zap },
      { key: 'stock',       label: 'Stock Val.',  icon: Package },
      { key: 'dead',        label: 'Dead Stock',  icon: AlertOctagon },
      { key: 'fast',        label: 'Fast Moving', icon: BarChart2 },
      { key: 'customers',   label: 'Customers',   icon: Users },
      { key: 'restored',    label: 'Stock Received', icon: RefreshCw },
      { key: 'my-activity', label: 'My Activity', icon: History }
    );
  } else if (normalizedRole === 'MANAGER') {
    availableTabs.push(
      { key: 'sales',       label: 'Sales',       icon: TrendingUp },
      { key: 'purchase',    label: 'Purchases',   icon: BarChart2 },
      { key: 'customers',   label: 'Customers',   icon: Users },
      { key: 'restored',    label: 'Stock Received', icon: RefreshCw },
      { key: 'my-activity', label: 'My Activity', icon: History }
    );
  } else {
    // CASHIER / staff
    availableTabs.push(
      { key: 'my-activity', label: 'My Activity', icon: History }
    );
  }

  const [activeTab, setActiveTab] = useState(availableTabs[0]?.key || 'my-activity');
  const [reportInterval, setReportInterval] = useState('monthly');

  // Date range picker state
  const getPastDateString = (days) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().split('T')[0];
  };
  const getTodayString = () => {
    return new Date().toISOString().split('T')[0];
  };

  const [dateRange, setDateRange] = useState({
    start: getPastDateString(30),
    end: getTodayString()
  });

  const fetchTabReport = (tab, range) => {
    const params = {};
    if (range.start) params.startDate = range.start;
    if (range.end) params.endDate = range.end;

    if (tab === 'sales') {
      if (normalizedRole === 'ADMIN') {
        dispatch(fetchSalesSummary({ interval: reportInterval }));
        dispatch(fetchMonthlyComparison());
      }
      dispatch(fetchSalesByDateRange(params));
    } else if (tab === 'purchase') {
      if (normalizedRole === 'ADMIN') {
        dispatch(fetchPurchaseSummary());
      }
      dispatch(fetchProductOrderFrequency(params));
    } else if (tab === 'profit' && normalizedRole === 'ADMIN') {
      dispatch(fetchProfitSummary());
      dispatch(fetchInventoryTurnover());
    } else if (tab === 'stock' && normalizedRole === 'ADMIN') {
      dispatch(fetchStockValuation());
    } else if (tab === 'dead' && normalizedRole === 'ADMIN') {
      dispatch(fetchDeadStock());
    } else if (tab === 'fast' && normalizedRole === 'ADMIN') {
      dispatch(fetchFastMovingProducts({ limit: 10 }));
    } else if (tab === 'customers') {
      dispatch(fetchTopCustomers({ limit: 10 }));
    } else if (tab === 'restored') {
      dispatch(fetchStockRestoredSummary(params));
    } else if (tab === 'my-activity') {
      dispatch(fetchMyTransactions(params));
    }
  };

  // Refetch when tab or dates are updated
  useEffect(() => {
    fetchTabReport(activeTab, dateRange);
  }, [dispatch, activeTab, reportInterval]);

  const handleApplyFilter = () => {
    fetchTabReport(activeTab, dateRange);
  };

  const handleResetFilter = () => {
    const defaultRange = { start: getPastDateString(30), end: getTodayString() };
    setDateRange(defaultRange);
    fetchTabReport(activeTab, defaultRange);
  };

  const {
    salesSummary, purchaseSummary, profitSummary, stockValuation, deadStock, fastMoving,
    salesByDateRange, myTransactions, productOrderFrequency, topCustomers, inventoryTurnover,
    stockRestored, monthlyComparison
  } = reports;

  // ─── Table Columns Definitions ─────────────────────────────────────────────

  const deadStockColumns = [
    { key: 'name', label: 'Product', sortable: true, render: (v) => <span className="font-medium text-navy">{v}</span> },
    { key: 'skuCode', label: 'SKU', render: (v) => <span className="text-grayMid text-xs">{v || '—'}</span> },
    { key: 'currentStock', label: 'Stock', sortable: true, render: (v) => <span className="font-semibold">{v}</span> },
    { key: 'unitCost', label: 'Unit Cost', render: (v) => formatCurrency(v || 0) },
    {
      key: 'totalCapitalTiedUp', label: 'Capital Tied',
      render: (v) => <span className="font-semibold text-red-600">{formatCurrency(v || 0)}</span>,
    },
    { key: 'addedAt', label: 'Added Date', render: (v) => <span className="text-grayMid text-xs">{formatDateOnly(v)}</span> },
  ];

  const fastColumns = [
    { key: 'rank', label: '#', render: (_, row, i) => <span className="font-bold text-grayMid">{(i || 0) + 1}</span> },
    { key: 'name', label: 'Product', sortable: true, render: (v) => <span className="font-medium text-navy">{v}</span> },
    { key: 'skuCode', label: 'SKU', render: (v) => <span className="text-grayMid text-xs">{v || '—'}</span> },
    { key: 'transactionCount', label: 'Transactions', sortable: true, render: (v) => <span className="font-semibold">{v}</span> },
    { key: 'totalQtySold', label: 'Qty Sold', sortable: true, render: (v) => <span className="font-semibold text-navy">{v}</span> },
    { key: 'currentStock', label: 'Stock Left', render: (v) => <span className="text-grayMid">{v ?? '—'}</span> },
  ];

  const salesByDateColumns = [
    { key: 'createdAt', label: 'Date/Time', render: (v) => <span className="text-xs text-navy">{formatDate(v)}</span> },
    {
      key: 'id', label: 'Receipt No.',
      render: (v) => <span className="font-mono text-xs text-grayMid bg-bg px-2 py-0.5 rounded">#{String(v).slice(-8).toUpperCase()}</span>
    },
    { key: 'customerName', label: 'Customer', render: (v, row) => <span className="font-medium">{v || row.customer?.name || 'Walk-in'}</span> },
    { key: 'creator', label: 'Cashier', render: (v) => <span className="text-xs text-grayMid">{v?.name || '—'}</span> },
    { key: 'items', label: 'Items Qty', render: (v) => <span className="text-xs">{v?.reduce((acc, i) => acc + i.quantity, 0) || 0} items</span> },
    { key: 'totalAmount', label: 'Amount', render: (v) => <span className="font-semibold text-navy">{formatCurrency(v)}</span> },
    { key: 'paymentMethod', label: 'Method', render: (v) => <span className="text-xs bg-bg px-2 py-1 rounded text-navy capitalize">{v || 'Cash'}</span> }
  ];

  const orderFreqColumns = [
    { key: 'rank', label: 'Rank', render: (v) => <span className="font-bold text-grayMid">{v}</span> },
    { key: 'name', label: 'Product', render: (v) => <span className="font-medium text-navy">{v}</span> },
    { key: 'skuCode', label: 'SKU', render: (v) => <span className="text-xs text-grayMid font-mono">{v}</span> },
    { key: 'orderCount', label: 'Order Count', render: (v) => <span className="font-semibold text-center">{v}</span> },
    { key: 'totalQuantityOrdered', label: 'Qty Ordered', render: (v) => <span className="font-semibold">{formatNumber(v)}</span> },
    { key: 'totalSpent', label: 'Total Expenditure', render: (v) => <span className="font-semibold text-navy">{formatCurrency(v)}</span> },
    { key: 'currentStock', label: 'Current Stock', render: (v) => <span className="text-xs text-grayMid">{v} left</span> }
  ];

  const topCustomersColumns = [
    { key: 'rank', label: '#', render: (_, __, i) => <span className="font-bold text-grayMid">{i + 1}</span> },
    { key: 'name', label: 'Customer Name', render: (v) => <span className="font-medium text-navy">{v}</span> },
    { key: 'phone', label: 'Phone', render: (v) => <span className="text-xs text-grayMid">{v || '—'}</span> },
    { key: 'totalPurchases', label: 'Orders Count', render: (v) => <span className="font-semibold">{v}</span> },
    { key: 'totalSpent', label: 'Total Spend', render: (v) => <span className="font-semibold text-navy">{formatCurrency(v)}</span> },
    { key: 'lastPurchase', label: 'Last Purchase', render: (v) => <span className="text-xs text-grayMid">{v ? formatDateOnly(v) : '—'}</span> }
  ];

  const restockColumns = [
    { key: 'createdAt', label: 'Date/Time', render: (v) => <span className="text-xs text-navy">{formatDate(v)}</span> },
    { key: 'product', label: 'Product (SKU)', render: (_, row) => (
      <div>
        <p className="font-medium text-navy text-sm">{row.product?.name || '—'}</p>
        <p className="text-xs text-grayMid font-mono">{row.product?.skuCode || '—'}</p>
      </div>
    )},
    { key: 'quantity', label: 'Qty Restored', render: (v) => <span className="font-semibold text-green-600">+{v}</span> },
    { key: 'previousStock', label: 'Stock Change', render: (_, row) => <span className="text-xs text-grayMid">{row.previousStock} → {row.newStock}</span> },
    { key: 'creator', label: 'Added By', render: (v) => <span className="text-xs text-navy">{v?.name || '—'}</span> },
    { key: 'note', label: 'Reference Note', render: (v) => <span className="text-xs text-grayMid italic">{v || '—'}</span> }
  ];

  const cashierColumns = [
    { key: 'createdAt', label: 'Date/Time', render: (v) => <span className="text-xs text-navy">{formatDate(v)}</span> },
    {
      key: 'id', label: 'Receipt No.',
      render: (v) => <span className="font-mono text-xs text-grayMid bg-bg px-2 py-0.5 rounded">#{String(v).slice(-8).toUpperCase()}</span>
    },
    { key: 'customerName', label: 'Customer', render: (v, row) => <span className="font-medium">{v || row.customer?.name || 'Walk-in'}</span> },
    { key: 'items', label: 'Items Count', render: (v) => <span className="text-xs">{v?.length || 0} items</span> },
    { key: 'totalAmount', label: 'Total Amount', render: (v) => <span className="font-semibold text-navy">{formatCurrency(v)}</span> },
    { key: 'paymentMethod', label: 'Payment Method', render: (v) => <span className="text-xs bg-bg px-2 py-1 rounded text-navy capitalize">{v || 'Cash'}</span> }
  ];

  const margin = profitSummary?.marginPercent || profitSummary?.profitMargin || 0;
  const marginColor = margin >= 20 ? 'text-emerald-600' : margin >= 10 ? 'text-amber-700' : 'text-red-600';

  // Helper to determine if date filter is active on the current tab
  const showDateFilter = ['sales', 'purchase', 'restored', 'my-activity'].includes(activeTab);

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" className="space-y-5">
      <PageHeader title="Reports & Analytics" subtitle="Complete business intelligence and history trackers" />

      {/* Tabs list */}
      <div className="flex gap-1 bg-white border border-border rounded-2xl p-1.5 overflow-x-auto scrollbar-thin">
        {availableTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap',
                activeTab === tab.key
                  ? 'bg-neon text-navyDeep font-semibold shadow-sm'
                  : 'text-grayMid hover:text-navy hover:bg-bg'
              )}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Dynamic Date Filter Bar */}
      {showDateFilter && (
        <div className="flex flex-wrap items-end gap-3 p-4 bg-white border border-border rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 text-grayMid text-xs font-semibold uppercase tracking-wider mb-2 w-full">
            <Calendar size={14} /> Filter Report By Custom Date Range
          </div>
          <div>
            <label className="text-xs text-grayMid font-medium mb-1 block">Start Date</label>
            <input type="date" value={dateRange.start} onChange={e => setDateRange(r => ({ ...r, start: e.target.value }))}
              className="px-3.5 py-2 rounded-xl border border-border bg-bg text-sm focus:outline-none focus:border-navy/40" />
          </div>
          <div>
            <label className="text-xs text-grayMid font-medium mb-1 block">End Date</label>
            <input type="date" value={dateRange.end} onChange={e => setDateRange(r => ({ ...r, end: e.target.value }))}
              className="px-3.5 py-2 rounded-xl border border-border bg-bg text-sm focus:outline-none focus:border-navy/40" />
          </div>
          <button onClick={handleApplyFilter} className="btn-primary py-2 text-sm px-5 flex items-center gap-1">
            <Filter size={14} /> Apply Filter
          </button>
          <button onClick={handleResetFilter}
            className="px-4 py-2 rounded-xl border border-border text-sm text-grayMid hover:bg-bg hover:text-navy transition-colors">
            Reset (Last 30 days)
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && <SkeletonLoader cardCount={4} />}

      {/* Tab Contents */}
      {!loading && (
        <div className="space-y-5">
          
          {/* SALES TAB */}
          {activeTab === 'sales' && (
            <div className="space-y-5">
              {normalizedRole === 'ADMIN' && salesSummary && (
                <div className="space-y-5">
                  <div className="flex items-center gap-2">
                    {REPORT_INTERVALS.map((r) => (
                      <button
                        key={r.value}
                        onClick={() => setReportInterval(r.value)}
                        className={cn(
                          'px-4 py-2 rounded-xl text-sm font-medium border transition-all',
                          reportInterval === r.value ? 'bg-navy text-white border-navy' : 'bg-white border-border text-grayMid hover:border-navy/40'
                        )}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <MetricCard label={`Sales (${reportInterval})`} value={formatNumber(salesSummary.totalSales)} />
                    <MetricCard label={`Revenue (${reportInterval})`} value={formatCurrency(salesSummary.totalRevenue)} accent />
                    <MetricCard label="Avg. Order Value" value={formatCurrency(salesSummary.avgOrderValue)} />
                  </div>

                  {/* MoM Chart */}
                  {monthlyComparison && monthlyComparison.length > 0 && (
                    <div className="card">
                      <h3 className="font-display font-semibold text-navy mb-4">Last 12 Months Revenue Trend (AI Sequential)</h3>
                      <ResponsiveContainer width="100%" height={250}>
                        <AreaChart data={monthlyComparison}>
                          <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#7dad3f" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="#7dad3f" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9D9DA3' }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 10, fill: '#9D9DA3' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #E5E7EB', borderRadius: '12px' }}
                            formatter={(v) => [formatCurrency(v), 'Revenue']}
                          />
                          <Area type="monotone" dataKey="revenue" stroke="#7dad3f" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              )}

              {/* Custom Date Range sales table */}
              {salesByDateRange && (
                <div className="space-y-4">
                  <div className="border-t border-border pt-4">
                    <h3 className="font-display font-semibold text-navy text-lg mb-2">Sales Records in Selected Date Range</h3>
                    <p className="text-xs text-grayMid mb-4">
                      Showing {salesByDateRange.totalSales} transactions. Total range revenue: <span className="font-semibold text-navy">{formatCurrency(salesByDateRange.totalRevenue)}</span>. Average ticket size: <span className="font-semibold text-navy">{formatCurrency(salesByDateRange.averageOrderValue)}</span>.
                    </p>
                  </div>
                  <DataTable
                    columns={salesByDateColumns}
                    data={salesByDateRange.transactions || []}
                    loading={loading}
                    emptyMessage="No sales found in the selected period."
                  />
                </div>
              )}
            </div>
          )}

          {/* PURCHASES TAB */}
          {activeTab === 'purchase' && (
            <div className="space-y-5">
              {normalizedRole === 'ADMIN' && purchaseSummary && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <MetricCard label="Total Purchases" value={formatNumber(purchaseSummary.totalPurchases)} />
                    <MetricCard label="Total Spent" value={formatCurrency(purchaseSummary.totalSpent)} accent />
                    <MetricCard label="Total Items Bought" value={formatNumber(purchaseSummary.totalItemsBought)} />
                    <MetricCard label="Avg. per Purchase" value={formatCurrency(purchaseSummary.avgPerPurchase)} />
                  </div>
                  {purchaseSummary.spendingTrends?.length > 0 && (
                    <div className="card">
                      <h3 className="font-display font-semibold text-navy mb-4">30-Day Spending Trend</h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={purchaseSummary.spendingTrends}>
                          <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9D9DA3' }} axisLine={false} tickLine={false} />
                          <YAxis hide />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #E5E7EB', borderRadius: '12px' }}
                            itemStyle={{ color: '#1B1946', fontWeight: 'bold' }}
                            formatter={(v) => [formatCurrency(v), 'Spent']}
                          />
                          <Line type="monotone" dataKey="amount" stroke="#1B1946" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              )}

              {/* Product order frequency */}
              {productOrderFrequency && (
                <div className="space-y-4">
                  <div className="border-t border-border pt-4">
                    <h3 className="font-display font-semibold text-navy text-lg mb-2">Product Supply Ordering Frequencies</h3>
                    <p className="text-xs text-grayMid mb-4">Analyzes which inventory products are ordered most or least from suppliers within the selected range.</p>
                  </div>
                  <DataTable
                    columns={orderFreqColumns}
                    data={productOrderFrequency}
                    loading={loading}
                    emptyMessage="No purchases recorded for any products during this period."
                  />
                </div>
              )}
            </div>
          )}

          {/* PROFIT & KPIs TAB */}
          {activeTab === 'profit' && normalizedRole === 'ADMIN' && (
            <div className="space-y-5">
              {profitSummary && (
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <MetricCard label="Revenue" value={formatCurrency(profitSummary.totalRevenue)} accent />
                  <MetricCard label="Cost of Goods (COGS)" value={formatCurrency(profitSummary.cogs || profitSummary.totalCost)} />
                  <MetricCard label="Estimated Profit" value={formatCurrency(profitSummary.profit)} />
                  <div className="card border-neon/30 flex flex-col justify-between">
                    <p className="text-xs text-grayMid font-medium uppercase tracking-wide">Margin %</p>
                    <p className={cn('font-display font-bold text-4xl mt-2', marginColor)}>{formatPercent(margin)}</p>
                    <p className="text-xs text-gray mt-1">
                      {margin >= 20 ? '✓ Healthy margin' : margin >= 10 ? '⚠ Moderate margin' : '⚠ Low margin'}
                    </p>
                  </div>
                </div>
              )}

              {/* Inventory Turnover KPIs */}
              {inventoryTurnover && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="card md:col-span-2 space-y-4">
                    <h3 className="font-display font-semibold text-navy text-lg border-b border-border pb-2">Inventory Efficiency KPIs</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-grayMid mb-1">Inventory Turnover Ratio</p>
                        <p className="font-display font-bold text-3xl text-navy">{inventoryTurnover.inventoryTurnoverRatio}x</p>
                        <p className="text-xs text-grayMid mt-1">How many times your entire inventory sold and replaced per year.</p>
                      </div>
                      <div>
                        <p className="text-xs text-grayMid mb-1">Days Inventory Outstanding (DIO)</p>
                        <p className="font-display font-bold text-3xl text-navy">{inventoryTurnover.daysInventoryOutstanding} days</p>
                        <p className="text-xs text-grayMid mt-1">Average number of days goods stay in stock before selling.</p>
                      </div>
                    </div>
                    <div className="bg-bg rounded-xl p-3.5 border border-border flex items-center justify-between text-sm">
                      <span className="font-medium text-grayMid">System Efficiency Rating:</span>
                      <span className={cn('font-bold uppercase tracking-wider px-3 py-1 rounded-full text-xs',
                        inventoryTurnover.inventoryTurnoverRatio >= 4 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                      )}>
                        {inventoryTurnover.interpretation}
                      </span>
                    </div>
                  </div>
                  <div className="card bg-navyDeep text-white space-y-4 flex flex-col justify-between">
                    <div>
                      <h4 className="font-display font-semibold text-neon">Capital Asset Valuation</h4>
                      <p className="text-xs text-grayLight mt-1">Snapshot of cash tied up in active warehouse stock.</p>
                    </div>
                    <div>
                      <p className="text-xs text-grayLight uppercase tracking-wider">Current Stock Value</p>
                      <p className="font-display font-bold text-3xl text-white mt-1">{formatCurrency(inventoryTurnover.currentInventoryValue)}</p>
                    </div>
                    <p className="text-xs text-grayLight">Keep turnover ratio high to avoid dead stock and optimize cash flow.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STOCK VALUATION TAB */}
          {activeTab === 'stock' && normalizedRole === 'ADMIN' && stockValuation && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <MetricCard label="Total Items" value={formatNumber(stockValuation.totalItems)} />
                <MetricCard label="Asset Value (Cost)" value={formatCurrency(stockValuation.totalCostValue)} />
                <MetricCard label="Retail Value" value={formatCurrency(stockValuation.totalRetailValue)} accent />
                <MetricCard label="Potential Profit" value={formatCurrency(stockValuation.potentialProfit)} />
              </div>
              <div className="card">
                <h3 className="font-display font-semibold text-navy mb-4">Cost vs Retail Comparison</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={[
                    { name: 'Cost Value', value: stockValuation.totalCostValue || 0 },
                    { name: 'Retail Value', value: stockValuation.totalRetailValue || 0 },
                  ]}>
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#5B5A6E' }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #E5E7EB', borderRadius: '12px' }}
                      formatter={(v) => [formatCurrency(v), 'Value']}
                    />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      <Cell fill="#9D9DA3" />
                      <Cell fill="#7dad3f" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* DEAD STOCK TAB */}
          {activeTab === 'dead' && normalizedRole === 'ADMIN' && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
                ⚠️ Dead stock: products with zero sales activity in the last 30 days. Consider launching promotions or clearance events.
              </div>
              <DataTable
                columns={deadStockColumns}
                data={deadStock}
                loading={loading}
                emptyMessage="No dead stock detected — all products are selling!"
              />
            </div>
          )}

          {/* FAST MOVING TAB */}
          {activeTab === 'fast' && normalizedRole === 'ADMIN' && (
            <div className="space-y-5">
              {fastMoving && fastMoving.length > 0 && (
                <div className="card">
                  <h3 className="font-display font-semibold text-navy mb-4">Top Fast Movers (By Order Count)</h3>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={fastMoving.slice(0, 10)} layout="vertical">
                      <XAxis type="number" hide />
                      <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11, fill: '#5B5A6E' }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #E5E7EB', borderRadius: '12px' }}
                        formatter={(v) => [`${v} units`, 'Qty Sold']}
                      />
                      <Bar dataKey="totalQtySold" radius={[0, 6, 6, 0]} fill="#7dad3f" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              <DataTable
                columns={fastColumns}
                data={fastMoving}
                loading={loading}
                emptyMessage="No fast-moving products data yet"
              />
            </div>
          )}

          {/* CUSTOMERS TAB */}
          {activeTab === 'customers' && topCustomers && (
            <div className="space-y-4">
              <div className="border-b border-border pb-3">
                <h3 className="font-display font-semibold text-navy text-lg">Loyal Customer Spend Ranking</h3>
                <p className="text-xs text-grayMid mt-1">Identifies top-spending accounts and client purchase volume to support targeting campaigns.</p>
              </div>
              <DataTable
                columns={topCustomersColumns}
                data={topCustomers}
                loading={loading}
                emptyMessage="No registered customer sales recorded yet."
              />
            </div>
          )}

          {/* STOCK RECEIVED TAB */}
          {activeTab === 'restored' && stockRestored && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="card">
                  <p className="text-xs text-grayMid uppercase tracking-wide">Restock/Receiving Events</p>
                  <p className="font-display font-bold text-2xl text-navy">{stockRestored.totalRestockEvents}</p>
                </div>
                <div className="card border-neon/30 bg-neon/5">
                  <p className="text-xs text-grayMid uppercase tracking-wide">Total Qty Restored</p>
                  <p className="font-display font-bold text-2xl text-navy">{formatNumber(stockRestored.totalQuantityRestored)}</p>
                </div>
              </div>
              <DataTable
                columns={restockColumns}
                data={stockRestored.movements || []}
                loading={loading}
                emptyMessage="No restock or additions logged during this period."
              />
            </div>
          )}

          {/* MY ACTIVITY TAB */}
          {activeTab === 'my-activity' && myTransactions && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="card">
                  <p className="text-xs text-grayMid uppercase tracking-wide">Your Sales (Count)</p>
                  <p className="font-display font-bold text-2xl text-navy">{myTransactions.totalTransactions}</p>
                </div>
                <div className="card border-neon/30 bg-neon/5">
                  <p className="text-xs text-grayMid uppercase tracking-wide">Your Total Revenue</p>
                  <p className="font-display font-bold text-2xl text-navy">{formatCurrency(myTransactions.totalRevenue)}</p>
                </div>
              </div>
              <div className="border-t border-border pt-4">
                <h3 className="font-display font-semibold text-navy text-base mb-3">Your Shift Sales Ledger</h3>
              </div>
              <DataTable
                columns={cashierColumns}
                data={myTransactions.transactions || []}
                loading={loading}
                emptyMessage="You have not checked out any transactions during this period."
              />
            </div>
          )}

        </div>
      )}
    </motion.div>
  );
}
