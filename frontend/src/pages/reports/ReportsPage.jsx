import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { BarChart2, TrendingUp, Package, Zap, AlertOctagon } from 'lucide-react';
import {
  fetchSalesSummary, fetchPurchaseSummary, fetchProfitSummary,
  fetchStockValuation, fetchDeadStock, fetchFastMovingProducts,
  selectReports, selectReportsLoading,
} from '../../store/slices/reportsSlice';
import PageHeader from '../../components/ui/PageHeader';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import DataTable from '../../components/ui/DataTable';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, Cell } from 'recharts';
import { formatCurrency, formatNumber, formatDateOnly, formatPercent } from '../../utils/formatters';
import { REPORT_INTERVALS } from '../../utils/constants';
import { cn } from '../../utils/cn';

const pageVariants = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

const TABS = [
  { key: 'sales',     label: 'Sales',       icon: TrendingUp },
  { key: 'purchase',  label: 'Purchases',   icon: BarChart2 },
  { key: 'profit',    label: 'Profit',      icon: Zap },
  { key: 'stock',     label: 'Stock Val.',  icon: Package },
  { key: 'dead',      label: 'Dead Stock',  icon: AlertOctagon },
  { key: 'fast',      label: 'Fast Moving', icon: BarChart2 },
];

const MetricCard = ({ label, value, subvalue, accent = false }) => (
  <div className={cn('card', accent && 'border-neon/30 bg-neon/5')}>
    <p className="text-xs text-grayMid font-medium uppercase tracking-wide mb-2">{label}</p>
    <p className={cn('font-display font-bold text-2xl', accent ? 'text-navyDeep' : 'text-navy')}>{value ?? '—'}</p>
    {subvalue && <p className="text-gray text-xs mt-1">{subvalue}</p>}
  </div>
);

export default function ReportsPage() {
  const dispatch = useDispatch();
  const reports = useSelector(selectReports);
  const loading = useSelector(selectReportsLoading);
  const [activeTab, setActiveTab] = useState('sales');
  const [reportInterval, setReportInterval] = useState('monthly');

  useEffect(() => {
    dispatch(fetchSalesSummary({ interval: reportInterval }));
    dispatch(fetchPurchaseSummary());
    dispatch(fetchProfitSummary());
    dispatch(fetchStockValuation());
    dispatch(fetchDeadStock());
    dispatch(fetchFastMovingProducts({ limit: 10 }));
  }, [dispatch, reportInterval]);

  const { salesSummary, purchaseSummary, profitSummary, stockValuation, deadStock, fastMoving } = reports;

  const deadStockColumns = [
    { key: 'name', label: 'Product', sortable: true, render: (v) => <span className="font-medium text-navy">{v}</span> },
    { key: 'skuCode', label: 'SKU', render: (v) => <span className="text-grayMid text-xs">{v || '—'}</span> },
    { key: 'currentStock', label: 'Stock', sortable: true, render: (v) => <span className="font-semibold">{v}</span> },
    { key: 'purchasePrice', label: 'Unit Cost', render: (v) => formatCurrency(v || 0) },
    {
      key: 'capitalTied', label: 'Capital Tied',
      render: (_, row) => <span className="font-semibold text-red-600">{formatCurrency((row.purchasePrice || 0) * (row.currentStock || 0))}</span>,
    },
    { key: 'createdAt', label: 'Added Date', render: (v) => <span className="text-grayMid text-xs">{formatDateOnly(v)}</span> },
  ];

  const fastColumns = [
    { key: 'rank', label: '#', render: (_, row, i) => <span className="font-bold text-grayMid">{(i || 0) + 1}</span> },
    { key: 'name', label: 'Product', sortable: true, render: (v) => <span className="font-medium text-navy">{v}</span> },
    { key: 'skuCode', label: 'SKU', render: (v) => <span className="text-grayMid text-xs">{v || '—'}</span> },
    { key: 'transactionCount', label: 'Transactions', sortable: true, render: (v) => <span className="font-semibold">{v}</span> },
    { key: 'totalQtySold', label: 'Qty Sold', sortable: true, render: (v) => <span className="font-semibold text-navy">{v}</span> },
    { key: 'currentStock', label: 'Stock Left', render: (v) => <span className="text-grayMid">{v ?? '—'}</span> },
  ];

  const margin = profitSummary?.marginPercent || profitSummary?.profitMargin || 0;
  const marginColor = margin >= 20 ? 'text-navyDeep' : margin >= 10 ? 'text-amber-700' : 'text-red-600';

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" className="space-y-5">
      <PageHeader title="Reports" subtitle="Business intelligence at a glance" />

      {/* Tabs */}
      <div className="flex gap-1 bg-white border border-border rounded-2xl p-1.5 overflow-x-auto scrollbar-thin">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap',
                activeTab === tab.key
                  ? 'bg-neon text-navyDeep font-semibold'
                  : 'text-grayMid hover:text-navy hover:bg-bg'
              )}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {loading && <SkeletonLoader cardCount={4} />}

      {!loading && activeTab === 'sales' && (
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
            <MetricCard label="Total Sales" value={formatNumber(salesSummary?.totalSales || 0)} />
            <MetricCard label="Total Revenue" value={formatCurrency(salesSummary?.totalRevenue || 0)} accent />
            <MetricCard label="Avg. Order Value" value={formatCurrency(salesSummary?.avgOrderValue || 0)} />
          </div>
        </div>
      )}

      {!loading && activeTab === 'purchase' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <MetricCard label="Total Purchases" value={formatNumber(purchaseSummary?.totalPurchases || 0)} />
            <MetricCard label="Total Spent" value={formatCurrency(purchaseSummary?.totalSpent || 0)} accent />
            <MetricCard label="Total Items Bought" value={formatNumber(purchaseSummary?.totalItemsBought || 0)} />
            <MetricCard label="Avg. per Purchase" value={formatCurrency(purchaseSummary?.avgPerPurchase || 0)} />
          </div>
          {purchaseSummary?.spendingTrends?.length > 0 && (
            <div className="card">
              <h3 className="font-display font-semibold text-navy mb-4">30-Day Spending Trend</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={purchaseSummary.spendingTrends}>
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9D9DA3' }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #E5E7EB',
                      borderRadius: '12px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)',
                    }}
                    itemStyle={{ color: '#1B1946', fontWeight: 'bold', fontSize: '13px' }}
                    labelStyle={{ color: '#5B5A6E', fontSize: '11px', marginBottom: '4px' }}
                    formatter={(v) => [formatCurrency(v), 'Spent']}
                  />
                  <Line type="monotone" dataKey="amount" stroke="#1B1946" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {!loading && activeTab === 'profit' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <MetricCard label="Revenue" value={formatCurrency(profitSummary?.totalRevenue || 0)} accent />
            <MetricCard label="Cost of Goods" value={formatCurrency(profitSummary?.cogs || profitSummary?.totalCost || 0)} />
            <MetricCard label="Estimated Profit" value={formatCurrency(profitSummary?.profit || 0)} />
            <div className="card border-neon/30 flex flex-col justify-between">
              <p className="text-xs text-grayMid font-medium uppercase tracking-wide">Margin %</p>
              <p className={cn('font-display font-bold text-4xl', marginColor)}>{formatPercent(margin)}</p>
              <p className="text-xs text-gray mt-1">
                {margin >= 20 ? '✓ Healthy margin' : margin >= 10 ? '⚠ Moderate margin' : '⚠ Low margin'}
              </p>
            </div>
          </div>
        </div>
      )}

      {!loading && activeTab === 'stock' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <MetricCard label="Total Items" value={formatNumber(stockValuation?.totalItems || 0)} />
            <MetricCard label="Asset (Cost)" value={formatCurrency(stockValuation?.totalCostValue || 0)} />
            <MetricCard label="Retail Value" value={formatCurrency(stockValuation?.totalRetailValue || 0)} accent />
            <MetricCard label="Potential Profit" value={formatCurrency((stockValuation?.totalRetailValue || 0) - (stockValuation?.totalCostValue || 0))} />
          </div>
          {stockValuation && (
            <div className="card">
              <h3 className="font-display font-semibold text-navy mb-4">Cost vs Retail Comparison</h3>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={[
                  { name: 'Cost Value', value: stockValuation.totalCostValue || 0 },
                  { name: 'Retail Value', value: stockValuation.totalRetailValue || 0 },
                ]}>
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#5B5A6E' }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #E5E7EB',
                      borderRadius: '12px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)',
                    }}
                    itemStyle={{ color: '#1B1946', fontWeight: 'bold', fontSize: '13px' }}
                    labelStyle={{ color: '#5B5A6E', fontSize: '11px', marginBottom: '4px' }}
                    formatter={(v) => [formatCurrency(v), 'Value']}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    <Cell fill="#9D9DA3" />
                    <Cell fill="#7dad3f" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {!loading && activeTab === 'dead' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
            Dead stock: products with no sales activity. Consider promotions or write-offs.
          </div>
          <DataTable
            columns={deadStockColumns}
            data={deadStock}
            loading={loading}
            emptyMessage="No dead stock detected — great job!"
          />
        </div>
      )}

      {!loading && activeTab === 'fast' && (
        <div className="space-y-5">
          {fastMoving.length > 0 && (
            <div className="card">
              <h3 className="font-display font-semibold text-navy mb-4">Top 10 Fast Movers</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={fastMoving.slice(0, 10)} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11, fill: '#5B5A6E' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #E5E7EB',
                      borderRadius: '12px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)',
                    }}
                    itemStyle={{ color: '#1B1946', fontWeight: 'bold', fontSize: '13px' }}
                    labelStyle={{ color: '#5B5A6E', fontSize: '11px', marginBottom: '4px' }}
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
    </motion.div>
  );
}
