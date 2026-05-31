import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { fetchPurchases, selectPurchases, selectPurchasesLoading } from '../../store/slices/purchasesSlice';
import DataTable from '../../components/ui/DataTable';
import PageHeader from '../../components/ui/PageHeader';
import { formatCurrency, formatDate } from '../../utils/formatters';

const pageVariants = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

export default function PurchasesPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const purchases = useSelector(selectPurchases);
  const loading = useSelector(selectPurchasesLoading);

  useEffect(() => { dispatch(fetchPurchases()); }, [dispatch]);

  const columns = [
    {
      key: 'id', label: 'Purchase ID',
      render: (v) => <span className="font-mono text-xs text-grayMid bg-bg px-2 py-1 rounded-lg">#{String(v).slice(-8).toUpperCase()}</span>,
    },
    {
      key: 'supplierName', label: 'Supplier',
      render: (v) => <span className="font-medium text-navy">{v || '—'}</span>,
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
      key: 'createdBy', label: 'Recorded By',
      render: (_, row) => <span className="text-grayMid text-xs">{row.user?.name || row.createdBy || '—'}</span>,
    },
    {
      key: 'createdAt', label: 'Date', sortable: true,
      render: (v) => <span className="text-grayMid text-xs">{formatDate(v)}</span>,
    },
    {
      key: 'actions', label: '',
      render: (_, row) => (
        <Link to={`/purchases/${row.id}`} className="text-xs text-navy font-medium hover:text-neon transition-colors">
          View →
        </Link>
      ),
    },
  ];

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" className="space-y-5">
      <PageHeader
        title="Purchases"
        subtitle={`${purchases.length} total purchases`}
        action={
          <button onClick={() => navigate('/purchases/new')} className="btn-primary">
            <Plus size={16} /> New Purchase
          </button>
        }
      />
      <DataTable
        columns={columns}
        data={purchases}
        loading={loading}
        emptyMessage="No purchases recorded yet"
        emptyAction={<button onClick={() => navigate('/purchases/new')} className="btn-primary">Record First Purchase</button>}
      />
    </motion.div>
  );
}
