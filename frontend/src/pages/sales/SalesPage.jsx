import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, BarChart2, Table } from 'lucide-react';
import { fetchSales, fetchDailySales, fetchMonthlySales, selectSales, selectSalesLoading, selectDailySales, selectMonthlySales } from '../../store/slices/salesSlice';
import DataTable from '../../components/ui/DataTable';
import Badge from '../../components/ui/Badge';
import PageHeader from '../../components/ui/PageHeader';
import RevenueBarChart from '../../components/charts/RevenueBarChart';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { cn } from '../../utils/cn';

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const VIEW_MODES = [
  { key: 'table', label: 'All Sales', icon: Table },
  { key: 'daily', label: 'Daily', icon: BarChart2 },
  { key: 'monthly', label: 'Monthly', icon: BarChart2 },
];

export default function SalesPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const sales = useSelector(selectSales);
  const loading = useSelector(selectSalesLoading);
  const dailySales = useSelector(selectDailySales);
  const monthlySales = useSelector(selectMonthlySales);
  const [view, setView] = useState('table');

  useEffect(() => {
    dispatch(fetchSales());
    dispatch(fetchDailySales());
    dispatch(fetchMonthlySales());
  }, [dispatch]);

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
    <motion.div variants={pageVariants} initial="initial" animate="animate" className="space-y-5">
      <PageHeader
        title="Sales"
        subtitle={`${sales.length} total sales`}
        action={
          <button onClick={() => navigate('/sales/new')} className="btn-primary">
            <Plus size={16} /> Record Sale
          </button>
        }
      />

      {/* View Toggle */}
      <div className="flex items-center gap-1 bg-white rounded-xl p-1 border border-border w-fit">
        {VIEW_MODES.map((mode) => (
          <button
            key={mode.key}
            onClick={() => setView(mode.key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              view === mode.key ? 'bg-navy text-white' : 'text-grayMid hover:text-navy'
            )}
          >
            <mode.icon size={14} />
            {mode.label}
          </button>
        ))}
      </div>

      {view === 'table' && (
        <DataTable
          columns={columns}
          data={sales}
          loading={loading}
          emptyMessage="No sales recorded yet"
          emptyAction={
            <button onClick={() => navigate('/sales/new')} className="btn-primary">
              Record First Sale
            </button>
          }
        />
      )}

      {view === 'daily' && (
        <RevenueBarChart data={dailySales} title="Daily Sales Revenue" labelKey="date" />
      )}

      {view === 'monthly' && (
        <RevenueBarChart data={monthlySales} title="Monthly Sales Revenue" labelKey="month" />
      )}
    </motion.div>
  );
}
