import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { fetchStockMovements, selectStockMovements, selectStockMovementsLoading } from '../../store/slices/stockMovementsSlice';
import DataTable from '../../components/ui/DataTable';
import Badge from '../../components/ui/Badge';
import PageHeader from '../../components/ui/PageHeader';
import { formatDate } from '../../utils/formatters';
import { MOVEMENT_TYPES } from '../../utils/constants';

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function StockMovementsPage() {
  const dispatch = useDispatch();
  const movements = useSelector(selectStockMovements);
  const loading = useSelector(selectStockMovementsLoading);
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    dispatch(fetchStockMovements());
  }, [dispatch]);

  const filtered = typeFilter
    ? movements.filter((m) => m.type === typeFilter)
    : movements;

  const columns = [
    {
      key: 'createdAt', label: 'Date / Time', sortable: true,
      render: (v) => <span className="text-grayMid text-xs">{formatDate(v)}</span>,
    },
    {
      key: 'product', label: 'Product',
      render: (_, row) => (
        <div>
          <p className="font-medium text-navy text-sm">{row.product?.name || row.productName || '—'}</p>
          <p className="text-grayMid text-xs">{row.product?.skuCode || '—'}</p>
        </div>
      ),
    },
    {
      key: 'type', label: 'Type',
      render: (v) => (
        <Badge variant={v === 'addition' ? 'addition' : 'reduction'}>
          {v === 'addition' ? '+ Addition' : '− Reduction'}
        </Badge>
      ),
    },
    { key: 'quantity', label: 'Qty', sortable: true, render: (v) => <span className="font-semibold">{v}</span> },
    { key: 'previousStock', label: 'Before', render: (v) => <span className="text-grayMid">{v ?? '—'}</span> },
    { key: 'newStock', label: 'After', render: (v) => <span className="font-medium text-navy">{v ?? '—'}</span> },
    {
      key: 'referenceType', label: 'Reference',
      render: (v) => <Badge variant="info">{v || 'manual'}</Badge>,
    },
    {
      key: 'user', label: 'By',
      render: (_, row) => <span className="text-grayMid text-xs">{row.creator?.name || row.user?.name || row.createdBy || '—'}</span>,
    },
    { key: 'note', label: 'Note', render: (v) => <span className="text-gray text-xs">{v || '—'}</span> },
  ];

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" className="space-y-5">
      <PageHeader title="Stock Movements" subtitle="All inventory movement history" />

      {/* Filter bar */}
      <div className="flex items-center gap-3">
        {MOVEMENT_TYPES.map((t) => (
          <button
            key={t.value}
            onClick={() => setTypeFilter(t.value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
              typeFilter === t.value
                ? 'bg-navy text-white border-navy'
                : 'bg-white border-border text-grayMid hover:border-navy/40'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        emptyMessage="No stock movements found"
      />
    </motion.div>
  );
}
