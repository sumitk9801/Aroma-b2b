import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { Plus, PackagePlus, Truck, Box, ArrowDownToLine, FileCheck } from 'lucide-react';
import { fetchReceivings, selectReceivings, selectReceivingsLoading } from '../../store/slices/stockMovementsSlice';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import { formatDate } from '../../utils/formatters';

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const parseDetailedNote = (detailedNote) => {
  if (!detailedNote) return { supplier: '—', userNote: '—' };
  
  let supplier = '—';
  let userNote = '—';
  
  const noteSeparator = '. Note:';
  const separatorIndex = detailedNote.indexOf(noteSeparator);
  if (separatorIndex !== -1) {
    userNote = detailedNote.substring(separatorIndex + noteSeparator.length).trim() || '—';
    const supplierPart = detailedNote.substring(0, separatorIndex);
    const supplierPrefix = 'from supplier:';
    const supplierPrefixIndex = supplierPart.indexOf(supplierPrefix);
    if (supplierPrefixIndex !== -1) {
      supplier = supplierPart.substring(supplierPrefixIndex + supplierPrefix.length).trim() || '—';
    }
  } else {
    const supplierPrefix = 'from supplier:';
    const supplierPrefixIndex = detailedNote.indexOf(supplierPrefix);
    if (supplierPrefixIndex !== -1) {
      let temp = detailedNote.substring(supplierPrefixIndex + supplierPrefix.length).trim();
      if (temp.endsWith('.')) {
        temp = temp.slice(0, -1);
      }
      supplier = temp.trim() || '—';
    }
  }
  
  return { supplier, userNote };
};

export default function StockReceivingPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const receivings = useSelector(selectReceivings);
  const loading = useSelector(selectReceivingsLoading);

  useEffect(() => {
    dispatch(fetchReceivings());
  }, [dispatch]);

  const columns = [
    {
      key: 'createdAt',
      label: 'Date & Time',
      sortable: true,
      render: (v) => <span className="text-sm text-grayMid">{formatDate(v)}</span>,
    },
    {
      key: 'product',
      label: 'Product',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-neon/10 border border-neon/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <Box size={14} className="text-neon" />
          </div>
          <div>
            <p className="text-sm font-semibold text-navy">{row.product?.name || '—'}</p>
            <p className="text-xs text-grayMid">{row.product?.skuCode || ''}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'quantity',
      label: 'Qty Received',
      sortable: true,
      render: (v) => (
        <span className="inline-flex items-center gap-1 text-sm font-bold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-lg">
          <ArrowDownToLine size={12} /> +{v}
        </span>
      ),
    },
    {
      key: 'supplier',
      label: 'Supplier',
      render: (_, row) => {
        const { supplier } = parseDetailedNote(row.note);
        return <span className="text-sm text-navy">{supplier}</span>;
      },
    },
    {
      key: 'previousStock',
      label: 'Previous Stock',
      render: (v) => <span className="text-grayMid text-sm">{v ?? '—'}</span>,
    },
    {
      key: 'newStock',
      label: 'New Stock',
      render: (v) => <span className="font-semibold text-navy text-sm">{v ?? '—'}</span>,
    },
    {
      key: 'referenceId',
      label: 'Delivery Note',
      render: (v) => v
        ? <span className="flex items-center gap-1 text-xs text-grayMid"><FileCheck size={12} />{v}</span>
        : <span className="text-grayMid text-xs">—</span>,
    },
    {
      key: 'note',
      label: 'Note',
      render: (v) => {
        const { userNote } = parseDetailedNote(v);
        return (
          <span className="text-xs text-grayMid max-w-[200px] truncate block" title={userNote}>
            {userNote}
          </span>
        );
      },
    },
    {
      key: 'creator',
      label: 'Received By',
      render: (_, row) => (
        <span className="text-sm text-navy">{row.creator?.name || '—'}</span>
      ),
    },
  ];

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" className="space-y-5">
      <PageHeader
        title="Stock Receiving"
        subtitle={`${receivings.length} received batch${receivings.length !== 1 ? 'es' : ''} on record`}
        action={
          <button
            onClick={() => navigate('/inventory/receiving/new')}
            className="btn-primary"
          >
            <Plus size={16} /> Receive Goods
          </button>
        }
      />

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl px-5 py-4 flex items-start gap-3">
        <Truck size={18} className="text-blue-500 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-blue-800">Operational Stock Receiving</p>
          <p className="text-xs text-blue-600 mt-0.5">
            Record physical goods arrival from suppliers and update inventory quantities. 
            Purchase Invoice management (financial tracking) is handled separately by Managers and Admins.
          </p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={receivings}
        loading={loading}
        emptyMessage="No stock receivings recorded yet"
        emptyAction={
          <button onClick={() => navigate('/inventory/receiving/new')} className="btn-primary">
            <PackagePlus size={16} /> Receive First Shipment
          </button>
        }
      />
    </motion.div>
  );
}
