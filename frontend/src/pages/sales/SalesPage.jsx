import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plus, BarChart2, Table, Calendar, Download, DollarSign,
  ShoppingCart, TrendingUp, Package, Percent, Clock,
  ArrowUpRight, ArrowDownRight, RefreshCcw, Tag
} from 'lucide-react';
import { fetchSales, selectSales, selectSalesLoading } from '../../store/slices/salesSlice';
import DataTable from '../../components/ui/DataTable';
import Badge from '../../components/ui/Badge';
import PageHeader from '../../components/ui/PageHeader';
import { formatCurrency, formatDate, formatDateOnly, formatShortDate } from '../../utils/formatters';
import { cn } from '../../utils/cn';
import { reportsApi } from '../../api/reports.api';
import { toast } from 'sonner';
import {
  AreaChart, Area, ComposedChart, Bar, Line, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell
} from 'recharts';

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const formatDateString = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export default function SalesPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const sales = useSelector(selectSales);
  const loadingSalesTable = useSelector(selectSalesLoading);

  const [view, setView] = useState('dashboard'); // 'dashboard' or 'table'
  const [datePreset, setDatePreset] = useState('today'); // 'today', 'yesterday', '7days', '30days', 'month', 'custom'
  const [startDate, setStartDate] = useState(() => formatDateString(new Date()));
  const [endDate, setEndDate] = useState(() => formatDateString(new Date()));

  const [currentData, setCurrentData] = useState(null);
  const [previousData, setPreviousData] = useState(null);
  const [last7DaysData, setLast7DaysData] = useState(null);
  const [prev7DaysData, setPrev7DaysData] = useState(null);
  const [loadingDashboard, setLoadingDashboard] = useState(false);

  const [chartMode, setChartMode] = useState('hourly'); // 'hourly', 'daily', 'weekly'

  // Update dates on preset selection
  useEffect(() => {
    if (datePreset !== 'custom') {
      const today = new Date();
      let start = new Date();
      let end = new Date();

      switch (datePreset) {
        case 'today':
          break;
        case 'yesterday':
          start.setDate(today.getDate() - 1);
          end.setDate(today.getDate() - 1);
          break;
        case '7days':
          start.setDate(today.getDate() - 6);
          break;
        case '30days':
          start.setDate(today.getDate() - 29);
          break;
        case 'month':
          start = new Date(today.getFullYear(), today.getMonth(), 1);
          break;
      }
      setStartDate(formatDateString(start));
      setEndDate(formatDateString(end));
    }
  }, [datePreset]);

  // Determine preceding range duration
  const previousPeriod = useMemo(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const prevEnd = new Date(start);
    prevEnd.setDate(start.getDate() - 1);

    const prevStart = new Date(prevEnd);
    prevStart.setDate(prevEnd.getDate() - diffDays);

    const prevStartStr = formatDateString(prevStart);
    const prevEndStr = formatDateString(prevEnd);

    return {
      startDate: prevStartStr,
      endDate: prevEndStr,
      label: diffDays === 0
        ? formatDateOnly(prevEnd)
        : `${formatDateOnly(prevStart)} - ${formatDateOnly(prevEnd)}`
    };
  }, [startDate, endDate]);

  const fetchDashboardData = async () => {
    setLoadingDashboard(true);
    try {
      const todayStr = formatDateString(new Date());
      const sevenDaysAgoStr = formatDateString(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000));
      const fourteenDaysAgoStr = formatDateString(new Date(Date.now() - 13 * 24 * 60 * 60 * 1000));
      const eightDaysAgoStr = formatDateString(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));

      const currentPromise = reportsApi.getSalesByDateRange({ startDate, endDate });
      const previousPromise = reportsApi.getSalesByDateRange({ startDate: previousPeriod.startDate, endDate: previousPeriod.endDate });

      let last7Promise;
      let prev7Promise;

      if (startDate === sevenDaysAgoStr && endDate === todayStr) {
        last7Promise = currentPromise;
        prev7Promise = previousPromise;
      } else {
        last7Promise = reportsApi.getSalesByDateRange({ startDate: sevenDaysAgoStr, endDate: todayStr });
        prev7Promise = reportsApi.getSalesByDateRange({ startDate: fourteenDaysAgoStr, endDate: eightDaysAgoStr });
      }

      const [currentRes, previousRes, last7Res, prev7Res] = await Promise.all([
        currentPromise,
        previousPromise,
        last7Promise,
        prev7Promise
      ]);

      setCurrentData(currentRes.data.data);
      setPreviousData(previousRes.data.data);
      setLast7DaysData(last7Res.data.data);
      setPrev7DaysData(prev7Res.data.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load sales dashboard data');
    } finally {
      setLoadingDashboard(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [startDate, endDate]);

  useEffect(() => {
    if (view === 'table') {
      dispatch(fetchSales());
    }
  }, [view, dispatch]);

  // Set chart mode based on date range duration
  useEffect(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    if (diffDays <= 1) {
      setChartMode('hourly');
    } else if (diffDays <= 30) {
      setChartMode('daily');
    } else {
      setChartMode('weekly');
    }
  }, [startDate, endDate]);

  // Export CSV Action
  const handleExportCSV = () => {
    if (!currentData || currentData.transactions.length === 0) {
      toast.error('No transactions to export');
      return;
    }

    const headers = ['Invoice ID', 'Date', 'Customer', 'Total Amount', 'Payment Method', 'Items Count', 'Created By'];
    const rows = currentData.transactions.map((t) => [
      `#${String(t.id).slice(-8).toUpperCase()}`,
      formatDate(t.createdAt),
      t.customerName || 'Walk-in',
      t.totalAmount,
      t.paymentMethod || 'Other',
      t.items?.length || 0,
      t.creator?.name || 'System'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,'
      + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sales_report_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Sales report exported to CSV!');
  };

  // Metrics aggregation logic
  const metrics = useMemo(() => {
    if (!currentData) return null;

    const calcMetrics = (data) => {
      const transactions = data.transactions || [];
      const refunds = data.refunds || [];

      const totalSales = transactions.reduce((acc, s) => acc + (s.totalAmount || 0), 0);
      const orders = transactions.length;
      const avgOrderValue = orders > 0 ? totalSales / orders : 0;

      const itemsSold = transactions.reduce((acc, s) =>
        acc + s.items.reduce((sum, item) => sum + (item.quantity || 0), 0), 0
      );

      const cogs = transactions.reduce((acc, s) =>
        acc + s.items.reduce((sum, item) => sum + (item.quantity || 0) * (item.product?.purchasePrice || 0), 0), 0
      );

      const grossProfit = totalSales - cogs;

      return { totalSales, orders, avgOrderValue, itemsSold, grossProfit, refunds };
    };

    const curr = calcMetrics(currentData);
    const prev = previousData ? calcMetrics(previousData) : null;

    const getChange = (cVal, pVal) => {
      if (!pVal || pVal === 0) return { pct: 0, text: 'vs previous period', positive: true };
      const pct = ((cVal - pVal) / pVal) * 100;
      const displayPct = Math.abs(pct).toFixed(1) + '%';
      return {
        pct,
        text: `${displayPct} vs previous period`,
        positive: pct >= 0
      };
    };

    return {
      totalSales: {
        value: formatCurrency(curr.totalSales),
        change: getChange(curr.totalSales, prev?.totalSales)
      },
      orders: {
        value: curr.orders,
        change: getChange(curr.orders, prev?.orders)
      },
      avgOrderValue: {
        value: formatCurrency(curr.avgOrderValue),
        change: getChange(curr.avgOrderValue, prev?.avgOrderValue)
      },
      itemsSold: {
        value: curr.itemsSold.toLocaleString(),
        change: getChange(curr.itemsSold, prev?.itemsSold)
      },
      grossProfit: {
        value: formatCurrency(curr.grossProfit),
        change: getChange(curr.grossProfit, prev?.grossProfit)
      }
    };
  }, [currentData, previousData]);

  // Hourly / Daily / Weekly Chart Calculations
  const revenueOverviewChartData = useMemo(() => {
    if (!currentData) return [];
    const transactions = currentData.transactions || [];

    if (chartMode === 'hourly') {
      const hourly = Array.from({ length: 24 }, (_, i) => {
        const ampm = i >= 12 ? 'PM' : 'AM';
        const hr = i % 12 === 0 ? 12 : i % 12;
        return {
          label: `${hr} ${ampm}`,
          hour: i,
          revenue: 0,
          orders: 0
        };
      });

      for (const t of transactions) {
        const hr = new Date(t.createdAt).getHours();
        hourly[hr].revenue += t.totalAmount;
        hourly[hr].orders += 1;
      }
      return hourly.filter(h => h.revenue > 0 || h.orders > 0 || (h.hour % 3 === 0)); // filter slightly to avoid cluttered axis but keep standard tick points
    }

    if (chartMode === 'daily') {
      const days = [];
      let curr = new Date(startDate);
      const end = new Date(endDate);
      while (curr <= end) {
        days.push(curr.toISOString().split('T')[0]);
        curr.setDate(curr.getDate() + 1);
      }

      const daily = days.map(d => ({
        label: formatShortDate(d),
        dateStr: d,
        revenue: 0,
        orders: 0
      }));

      for (const t of transactions) {
        const dateStr = new Date(t.createdAt).toISOString().split('T')[0];
        const found = daily.find(item => item.dateStr === dateStr);
        if (found) {
          found.revenue += t.totalAmount;
          found.orders += 1;
        }
      }
      return daily;
    }

    // Weekly
    const weeklyData = {};
    for (const t of transactions) {
      const d = new Date(t.createdAt);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1); // get Monday
      const monday = new Date(d.setDate(diff));
      const weekStr = monday.toISOString().split('T')[0];

      if (!weeklyData[weekStr]) {
        weeklyData[weekStr] = { label: `Wk of ${formatShortDate(weekStr)}`, weekKey: weekStr, revenue: 0, orders: 0 };
      }
      weeklyData[weekStr].revenue += t.totalAmount;
      weeklyData[weekStr].orders += 1;
    }
    return Object.values(weeklyData).sort((a, b) => a.weekKey.localeCompare(b.weekKey));
  }, [currentData, chartMode, startDate, endDate]);

  // Sales by Payment Method
  const paymentMethodChartData = useMemo(() => {
    if (!currentData) return [];
    const transactions = currentData.transactions || [];

    const breakdown = {
      cash: { name: 'Cash', value: 0, color: '#7dad3f' },
      card: { name: 'Card', value: 0, color: '#3b82f6' },
      upi: { name: 'UPI', value: 0, color: '#a855f7' },
      wallet: { name: 'Wallet', value: 0, color: '#eab308' },
    };

    let total = 0;
    for (const t of transactions) {
      const method = (t.paymentMethod || 'cash').toLowerCase();
      const amt = t.totalAmount || 0;
      total += amt;
      if (breakdown[method]) {
        breakdown[method].value += amt;
      } else {
        breakdown.cash.value += amt;
      }
    }

    return Object.values(breakdown).map(item => ({
      ...item,
      percentage: total > 0 ? ((item.value / total) * 100).toFixed(1) : '0.0'
    }));
  }, [currentData]);

  // Top Selling Products
  const topSellingProducts = useMemo(() => {
    if (!currentData) return [];
    const transactions = currentData.transactions || [];

    const productSales = {};
    for (const t of transactions) {
      for (const item of t.items) {
        const pid = item.productId;
        if (!productSales[pid]) {
          productSales[pid] = {
            id: pid,
            name: item.product?.name || 'Unknown Product',
            qtySold: 0,
            revenue: 0,
            image: item.product?.image
          };
        }
        productSales[pid].qtySold += item.quantity;
        productSales[pid].revenue += item.subtotal;
      }
    }

    return Object.values(productSales)
      .sort((a, b) => b.qtySold - a.qtySold)
      .slice(0, 5);
  }, [currentData]);

  // Sales by Category
  const salesByCategory = useMemo(() => {
    if (!currentData) return [];
    const transactions = currentData.transactions || [];
    const totalSales = transactions.reduce((acc, s) => acc + (s.totalAmount || 0), 0);

    const categorySales = {};
    for (const t of transactions) {
      for (const item of t.items) {
        const catName = item.product?.categoryRef?.name || 'Others';
        if (!categorySales[catName]) {
          categorySales[catName] = 0;
        }
        categorySales[catName] += item.subtotal;
      }
    }

    return Object.entries(categorySales)
      .map(([name, amount]) => ({
        name,
        amount,
        percentage: totalSales > 0 ? (amount / totalSales) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [currentData]);

  // Sales Summary Block calculations
  const salesSummary = useMemo(() => {
    if (!currentData) return null;
    const transactions = currentData.transactions || [];
    const refunds = currentData.refunds || [];
    const totalSales = transactions.reduce((acc, s) => acc + (s.totalAmount || 0), 0);

    // Hourly distributions
    const hourlyRevenue = Array(24).fill(0);
    for (const t of transactions) {
      const hour = new Date(t.createdAt).getHours();
      hourlyRevenue[hour] += t.totalAmount;
    }

    // Best 3-hour window
    let max3h = -1;
    let best3hStart = 9;
    for (let i = 0; i <= 21; i++) {
      const sum = hourlyRevenue[i] + hourlyRevenue[i + 1] + hourlyRevenue[i + 2];
      if (sum > max3h) {
        max3h = sum;
        best3hStart = i;
      }
    }

    const formatHour = (h) => {
      const ampm = h >= 12 ? 'PM' : 'AM';
      const hr = h % 12 === 0 ? 12 : h % 12;
      return `${hr} ${ampm}`;
    };

    const bestSellingTime = `${formatHour(best3hStart)} – ${formatHour(best3hStart + 3)}`;

    // Highest Revenue single hour
    let maxHourRev = -1;
    let highestHour = 12;
    for (let i = 0; i < 24; i++) {
      if (hourlyRevenue[i] > maxHourRev) {
        maxHourRev = hourlyRevenue[i];
        highestHour = i;
      }
    }

    // Lowest Revenue single hour
    let minHourRev = Infinity;
    let lowestHour = 0;
    let hasSales = false;
    for (let i = 0; i < 24; i++) {
      if (hourlyRevenue[i] > 0 && hourlyRevenue[i] < minHourRev) {
        minHourRev = hourlyRevenue[i];
        lowestHour = i;
        hasSales = true;
      }
    }

    // Refunds
    const totalRefunds = refunds.reduce((acc, r) => acc + (r.amount || 0), 0);
    const refundPercentage = totalSales > 0 ? (totalRefunds / totalSales) * 100 : 0;

    // Discounts
    const totalDiscounts = transactions.reduce((acc, s) =>
      acc + s.items.reduce((sum, item) => {
        const productListPrice = item.product?.sellingPrice || 0;
        const discountPerUnit = Math.max(0, productListPrice - item.sellingPrice);
        return sum + discountPerUnit * item.quantity;
      }, 0), 0
    );
    const discountPercentage = totalSales > 0 ? (totalDiscounts / totalSales) * 100 : 0;

    return {
      bestSellingTime,
      highestRevenue: hasSales ? `${formatCurrency(maxHourRev)} (${formatHour(highestHour)} – ${formatHour(highestHour + 1)})` : '—',
      lowestRevenue: hasSales ? `${formatCurrency(minHourRev)} (${formatHour(lowestHour)} – ${formatHour(lowestHour + 1)})` : '—',
      refunds: `${formatCurrency(totalRefunds)} (${refundPercentage.toFixed(1)}%)`,
      discounts: `${formatCurrency(totalDiscounts)} (${discountPercentage.toFixed(1)}%)`
    };
  }, [currentData]);

  // Last 7 Days trend chart
  const bottom7DaysTrend = useMemo(() => {
    if (!last7DaysData) return [];
    const transactions = last7DaysData.transactions || [];

    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().split('T')[0]);
    }

    const trend = days.map(d => ({
      label: formatShortDate(d),
      dateStr: d,
      revenue: 0
    }));

    for (const t of transactions) {
      const dateStr = new Date(t.createdAt).toISOString().split('T')[0];
      const found = trend.find(item => item.dateStr === dateStr);
      if (found) {
        found.revenue += t.totalAmount;
      }
    }
    return trend;
  }, [last7DaysData]);

  // Last 7 Days Totals & Trends (bottom right)
  const bottom7DaysTotals = useMemo(() => {
    if (!last7DaysData) return null;
    const currTotal = (last7DaysData.transactions || []).reduce((acc, s) => acc + (s.totalAmount || 0), 0);
    const prevTotal = (prev7DaysData?.transactions || []).reduce((acc, s) => acc + (s.totalAmount || 0), 0);

    const diff = currTotal - prevTotal;
    const pct = prevTotal > 0 ? (diff / prevTotal) * 100 : 0;
    const isPositive = pct >= 0;

    return {
      total: formatCurrency(currTotal),
      pctText: `${isPositive ? '+' : ''}${pct.toFixed(1)}% vs previous 7 days`,
      isPositive
    };
  }, [last7DaysData, prev7DaysData]);

  const columns = [
    {
      key: 'id', label: 'Invoice',
      render: (v) => (
        <span className="font-mono text-xs text-grayMid bg-bg px-2 py-1 rounded-lg">
          #{String(v).slice(-8).toUpperCase()}
        </span>
      ),
    },
    {
      key: 'customerName', label: 'Customer',
      render: (v) => <span className="font-medium text-navy">{v || 'Walk-in'}</span>,
    },
    {
      key: 'items', label: 'Items',
      render: (_, row) => row.itemCount || row.items?.length || '—',
    },
    {
      key: 'totalAmount', label: 'Total', sortable: true,
      render: (v) => <span className="font-semibold text-navy">{formatCurrency(v || 0)}</span>,
    },
    {
      key: 'paymentMethod', label: 'Payment',
      render: (v) => <Badge variant={v?.toLowerCase() || 'other'}>{v || 'Other'}</Badge>,
    },
    {
      key: 'createdAt', label: 'Date', sortable: true,
      render: (v) => <span className="text-grayMid text-xs">{formatDate(v)}</span>,
    },
    {
      key: 'actions', label: '',
      render: (_, row) => (
        <Link to={`/sales/${row.id}`} className="text-xs text-navy font-medium hover:text-neon transition-colors">
          View →
        </Link>
      ),
    },
  ];

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-navy text-2xl">Sales</h1>
          <p className="text-grayLight text-xs mt-0.5">
            {view === 'dashboard' ? 'Real-time overview of your business sales performance' : `${sales.length} total sales invoices`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-white rounded-xl p-1 border border-border">
            <button
              onClick={() => setView('dashboard')}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                view === 'dashboard' ? 'bg-navy text-white shadow-sm' : 'text-grayMid hover:text-navy'
              )}
            >
              <BarChart2 size={13} />
              Dashboard
            </button>
            <button
              onClick={() => setView('table')}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                view === 'table' ? 'bg-navy text-white shadow-sm' : 'text-grayMid hover:text-navy'
              )}
            >
              <Table size={13} />
              All Sales
            </button>
          </div>

          {view === 'dashboard' && (
            <>
              {/* Preset Selector */}
              <select
                value={datePreset}
                onChange={(e) => setDatePreset(e.target.value)}
                className="select-base !text-xs !py-1.5 !pr-8"
              >
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="month">This Month</option>
                <option value="custom">Custom Range</option>
              </select>

              {/* Custom Date Picker */}
              {datePreset === 'custom' && (
                <div className="flex items-center gap-2 bg-white rounded-xl border border-border px-3 py-1">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="text-xs text-navy focus:outline-none"
                  />
                  <span className="text-grayLight text-xs">→</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="text-xs text-navy focus:outline-none"
                  />
                </div>
              )}

              {/* Export Button */}
              <button
                onClick={handleExportCSV}
                disabled={loadingDashboard}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-lime hover:bg-lime/90 disabled:opacity-50 transition-colors shadow-sm"
              >
                <Download size={13} />
                Export
              </button>
            </>
          )}

          {/* Record Sale Button */}
          <button
            onClick={() => navigate('/sales/new')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-navy hover:bg-navyDeep transition-colors shadow-sm"
          >
            <Plus size={13} />
            Record Sale
          </button>
        </div>
      </div>

      {view === 'table' ? (
        <DataTable
          columns={columns}
          data={sales}
          loading={loadingSalesTable}
          emptyMessage="No sales recorded yet"
          emptyAction={
            <button onClick={() => navigate('/sales/new')} className="btn-primary">
              Record First Sale
            </button>
          }
        />
      ) : (
        /* Sales Dashboard View */
        <div className="space-y-6">
          {loadingDashboard && !currentData ? (
            /* Loading State Skeleton */
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-28 bg-white border border-border rounded-2xl animate-pulse" />
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 h-72 bg-white border border-border rounded-2xl animate-pulse" />
                <div className="h-72 bg-white border border-border rounded-2xl animate-pulse" />
              </div>
            </div>
          ) : (
            <>
              {/* Metrics Grid */}
              {metrics && (
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                  {/* Total Sales */}
                  <div className="card p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-grayLight text-xs font-semibold uppercase">Total Sales</span>
                      <div className="w-8 h-8 rounded-lg bg-neon/10 flex items-center justify-center text-neon"><DollarSign size={16} /></div>
                    </div>
                    <div className="mt-3">
                      <p className="text-xl font-bold text-navy font-display">{metrics.totalSales.value}</p>
                      <div className="flex items-center gap-1 mt-1 text-[10px]">
                        <span className={cn('flex items-center font-semibold', metrics.totalSales.change.positive ? 'text-neon' : 'text-red-500')}>
                          {metrics.totalSales.change.positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                          {Math.abs(metrics.totalSales.change.pct).toFixed(1)}%
                        </span>
                        <span className="text-gray text-[9px] truncate">{metrics.totalSales.change.text.split(' vs ')[1]}</span>
                      </div>
                    </div>
                  </div>

                  {/* Orders */}
                  <div className="card p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-grayLight text-xs font-semibold uppercase">Orders</span>
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500"><ShoppingCart size={16} /></div>
                    </div>
                    <div className="mt-3">
                      <p className="text-xl font-bold text-navy font-display">{metrics.orders.value}</p>
                      <div className="flex items-center gap-1 mt-1 text-[10px]">
                        <span className={cn('flex items-center font-semibold', metrics.orders.change.positive ? 'text-neon' : 'text-red-500')}>
                          {metrics.orders.change.positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                          {Math.abs(metrics.orders.change.pct).toFixed(1)}%
                        </span>
                        <span className="text-gray text-[9px] truncate">{metrics.orders.change.text.split(' vs ')[1]}</span>
                      </div>
                    </div>
                  </div>

                  {/* Avg Order Value */}
                  <div className="card p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-grayLight text-xs font-semibold uppercase">Avg. Order Value</span>
                      <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500"><TrendingUp size={16} /></div>
                    </div>
                    <div className="mt-3">
                      <p className="text-xl font-bold text-navy font-display">{metrics.avgOrderValue.value}</p>
                      <div className="flex items-center gap-1 mt-1 text-[10px]">
                        <span className={cn('flex items-center font-semibold', metrics.avgOrderValue.change.positive ? 'text-neon' : 'text-red-500')}>
                          {metrics.avgOrderValue.change.positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                          {Math.abs(metrics.avgOrderValue.change.pct).toFixed(1)}%
                        </span>
                        <span className="text-gray text-[9px] truncate">{metrics.avgOrderValue.change.text.split(' vs ')[1]}</span>
                      </div>
                    </div>
                  </div>

                  {/* Items Sold */}
                  <div className="card p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-grayLight text-xs font-semibold uppercase">Items Sold</span>
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500"><Package size={16} /></div>
                    </div>
                    <div className="mt-3">
                      <p className="text-xl font-bold text-navy font-display">{metrics.itemsSold.value}</p>
                      <div className="flex items-center gap-1 mt-1 text-[10px]">
                        <span className={cn('flex items-center font-semibold', metrics.itemsSold.change.positive ? 'text-neon' : 'text-red-500')}>
                          {metrics.itemsSold.change.positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                          {Math.abs(metrics.itemsSold.change.pct).toFixed(1)}%
                        </span>
                        <span className="text-gray text-[9px] truncate">{metrics.itemsSold.change.text.split(' vs ')[1]}</span>
                      </div>
                    </div>
                  </div>

                  {/* Gross Profit */}
                  <div className="card p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-grayLight text-xs font-semibold uppercase">Gross Profit</span>
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500"><Percent size={16} /></div>
                    </div>
                    <div className="mt-3">
                      <p className="text-xl font-bold text-navy font-display">{metrics.grossProfit.value}</p>
                      <div className="flex items-center gap-1 mt-1 text-[10px]">
                        <span className={cn('flex items-center font-semibold', metrics.grossProfit.change.positive ? 'text-neon' : 'text-red-500')}>
                          {metrics.grossProfit.change.positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                          {Math.abs(metrics.grossProfit.change.pct).toFixed(1)}%
                        </span>
                        <span className="text-gray text-[9px] truncate">{metrics.grossProfit.change.text.split(' vs ')[1]}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Middle Row Charts */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Sales Revenue Overview */}
                <div className="xl:col-span-2 card p-5 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-display font-semibold text-navy text-sm">Sales Revenue Overview</h3>
                      {metrics && (
                        <div className="flex items-baseline gap-2 mt-1">
                          <span className="text-xl font-bold text-navy">{metrics.totalSales.value}</span>
                          <span className={cn('flex items-center text-[10px] font-semibold', metrics.totalSales.change.positive ? 'text-neon' : 'text-red-500')}>
                            {metrics.totalSales.change.positive ? '▲' : '▼'} {Math.abs(metrics.totalSales.change.pct).toFixed(1)}%
                          </span>
                        </div>
                      )}
                    </div>
                    {/* Interval Switcher */}
                    <div className="flex items-center gap-0.5 bg-bg rounded-lg p-0.5 border border-border">
                      {['hourly', 'daily', 'weekly'].map((mode) => (
                        <button
                          key={mode}
                          onClick={() => setChartMode(mode)}
                          className={cn(
                            'px-2.5 py-1 rounded-md text-[10px] font-bold capitalize transition-all',
                            chartMode === mode ? 'bg-white text-navy shadow-sm' : 'text-grayMid hover:text-navy'
                          )}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="h-64 mt-3">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={revenueOverviewChartData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
                        <XAxis
                          dataKey="label"
                          tick={{ fill: '#9D9DA3', fontSize: 9 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          yAxisId="left"
                          tickFormatter={(val) => `₹${val >= 1000 ? (val / 1000).toFixed(0) + 'K' : val}`}
                          tick={{ fill: '#9D9DA3', fontSize: 9 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          tick={{ fill: '#9D9DA3', fontSize: 9 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          formatter={(value, name) => {
                            if (name === 'revenue') return [formatCurrency(value), 'Revenue'];
                            return [value, 'Orders'];
                          }}
                          contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #B7B8C5', fontSize: '11px' }}
                        />
                        <Bar yAxisId="left" dataKey="revenue" fill="#7dad3f" radius={[4, 4, 0, 0]} maxBarSize={30} name="revenue" />
                        <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#1B1946" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} name="orders" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Sales by Payment Method */}
                <div className="card p-5 flex flex-col justify-between">
                  <div className="border-b border-border pb-3">
                    <h3 className="font-display font-semibold text-navy text-sm">Sales by Payment Method</h3>
                  </div>

                  <div className="flex items-center justify-between gap-2 h-full py-4">
                    <div className="relative w-1/2 h-40 flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={paymentMethodChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={65}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {paymentMethodChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      {/* Center labels */}
                      {currentData && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                          <span className="text-grayLight text-[9px] uppercase font-bold tracking-wide">Total</span>
                          <span className="text-navy font-bold text-xs truncate max-w-[80px]">
                            {formatCurrency(currentData.transactions.reduce((acc, s) => acc + (s.totalAmount || 0), 0))}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="w-1/2 space-y-2.5">
                      {paymentMethodChartData.map((item, idx) => (
                        <div key={idx} className="flex flex-col text-xs">
                          <div className="flex items-center gap-1.5 justify-between">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                              <span className="font-medium text-navy truncate">{item.name}</span>
                            </div>
                            <span className="font-semibold text-navy flex-shrink-0">{formatCurrency(item.value)}</span>
                          </div>
                          <span className="text-[10px] text-grayLight ml-3.5">({item.percentage}%)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 3 widgets */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Top Selling Products */}
                <div className="card p-0 flex flex-col justify-between overflow-hidden">
                  <div>
                    <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                      <h3 className="font-display font-semibold text-navy text-sm">Top Selling Products</h3>
                    </div>
                    <div className="divide-y divide-border">
                      {topSellingProducts.length === 0 ? (
                        <p className="text-center text-grayMid text-xs py-12">No products sold in this period</p>
                      ) : (
                        topSellingProducts.map((p, i) => (
                          <div key={i} className="px-5 py-3 flex items-center justify-between text-xs hover:bg-paleGreen/20 transition-colors">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-bg border border-border flex items-center justify-center font-bold text-navy flex-shrink-0">
                                {p.name.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-medium text-navy truncate">{p.name}</span>
                            </div>
                            <div className="text-right flex-shrink-0 ml-2">
                              <p className="font-semibold text-navy">{p.qtySold} sold</p>
                              <p className="text-[10px] text-grayLight">{formatCurrency(p.revenue)}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  <div className="px-5 py-3 border-t border-border bg-bg/40 text-center">
                    <Link to="/products" className="text-xs font-semibold text-neon hover:underline">
                      View all products
                    </Link>
                  </div>
                </div>

                {/* Sales by Category */}
                <div className="card p-0 flex flex-col justify-between overflow-hidden">
                  <div>
                    <div className="px-5 py-4 border-b border-border">
                      <h3 className="font-display font-semibold text-navy text-sm">Sales by Category</h3>
                    </div>
                    <div className="p-5 space-y-4">
                      {salesByCategory.length === 0 ? (
                        <p className="text-center text-grayMid text-xs py-8">No category data</p>
                      ) : (
                        salesByCategory.map((cat, i) => (
                          <div key={i} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="font-medium text-navy">{cat.name}</span>
                              <span className="font-semibold text-navy">{formatCurrency(cat.amount)} ({cat.percentage.toFixed(1)}%)</span>
                            </div>
                            <div className="w-full bg-bg rounded-full h-2">
                              <div className="bg-neon h-2 rounded-full" style={{ width: `${cat.percentage}%` }} />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  <div className="px-5 py-3 border-t border-border bg-bg/40 text-center">
                    <Link to="/categories" className="text-xs font-semibold text-neon hover:underline">
                      View all categories
                    </Link>
                  </div>
                </div>

                {/* Sales Summary List */}
                <div className="card p-5 flex flex-col justify-between">
                  <div className="border-b border-border pb-3">
                    <h3 className="font-display font-semibold text-navy text-sm">Sales Summary</h3>
                  </div>

                  {salesSummary ? (
                    <div className="space-y-4 py-2">
                      {/* Best Selling Time */}
                      <div className="flex items-center gap-3 text-xs">
                        <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 flex-shrink-0">
                          <Clock size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-grayLight text-[10px] uppercase font-bold">Best Selling Time</p>
                          <p className="font-semibold text-navy truncate mt-0.5">{salesSummary.bestSellingTime}</p>
                        </div>
                      </div>

                      {/* Highest Revenue */}
                      <div className="flex items-center gap-3 text-xs">
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 flex-shrink-0">
                          <TrendingUp size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-grayLight text-[10px] uppercase font-bold">Highest Revenue</p>
                          <p className="font-semibold text-navy truncate mt-0.5">{salesSummary.highestRevenue}</p>
                        </div>
                      </div>

                      {/* Lowest Revenue */}
                      <div className="flex items-center gap-3 text-xs">
                        <div className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500 flex-shrink-0">
                          <ArrowDownRight size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-grayLight text-[10px] uppercase font-bold">Lowest Revenue Hour</p>
                          <p className="font-semibold text-navy truncate mt-0.5">{salesSummary.lowestRevenue}</p>
                        </div>
                      </div>

                      {/* Refunds */}
                      <div className="flex items-center gap-3 text-xs">
                        <div className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500 flex-shrink-0">
                          <RefreshCcw size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-grayLight text-[10px] uppercase font-bold">Refunds</p>
                          <p className="font-semibold text-red-500 truncate mt-0.5">{salesSummary.refunds}</p>
                        </div>
                      </div>

                      {/* Discounts */}
                      <div className="flex items-center gap-3 text-xs">
                        <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 flex-shrink-0">
                          <Tag size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-grayLight text-[10px] uppercase font-bold">Discounts Given</p>
                          <p className="font-semibold text-navy truncate mt-0.5">{salesSummary.discounts}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-center text-grayMid text-xs py-12">No summary available</p>
                  )}
                </div>
              </div>

              {/* Bottom Row: Sales Trend (Last 7 Days) */}
              <div className="card p-0 overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-border">
                  {/* Chart section */}
                  <div className="lg:col-span-2 p-5 flex flex-col justify-between">
                    <div>
                      <h3 className="font-display font-semibold text-navy text-sm">Sales Trend (Last 7 Days)</h3>
                      <p className="text-gray text-[10px] mt-0.5">Overall daily revenue overview</p>
                    </div>

                    <div className="h-44 mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={bottom7DaysTrend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="salesTrendGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#7dad3f" stopOpacity={0.3} />
                              <stop offset="100%" stopColor="#7dad3f" stopOpacity={0.01} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
                          <XAxis
                            dataKey="label"
                            tick={{ fill: '#9D9DA3', fontSize: 9 }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            tickFormatter={(val) => `₹${val >= 1000 ? (val / 1000).toFixed(0) + 'K' : val}`}
                            tick={{ fill: '#9D9DA3', fontSize: 9 }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip
                            formatter={(value) => [formatCurrency(value), 'Revenue']}
                            contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #B7B8C5', fontSize: '11px' }}
                          />
                          <Area
                            type="monotone"
                            dataKey="revenue"
                            stroke="#7dad3f"
                            strokeWidth={2}
                            fill="url(#salesTrendGradient)"
                            dot={{ r: 2 }}
                            activeDot={{ r: 4 }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Sidebar section */}
                  {bottom7DaysTotals && (
                    <div className="p-5 flex flex-col justify-center bg-bg/20">
                      <p className="text-grayLight text-[10px] uppercase font-bold">Total (7 Days)</p>
                      <p className="text-2xl font-bold text-navy font-display mt-1">{bottom7DaysTotals.total}</p>
                      <div className="flex items-center gap-1 mt-1 text-xs">
                        <span className={cn('flex items-center font-bold', bottom7DaysTotals.isPositive ? 'text-neon' : 'text-red-500')}>
                          {bottom7DaysTotals.isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                          {bottom7DaysTotals.pctText.split(' vs ')[0]}
                        </span>
                        <span className="text-grayLight text-[11px] font-medium">vs previous 7 days</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </motion.div>
  );
}
