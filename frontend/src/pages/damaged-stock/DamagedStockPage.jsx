import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { AlertTriangle, Plus, X, AlertOctagon } from 'lucide-react';
import {
  reportDamage, fetchDamageReports, fetchDamageSummary,
  selectDamageReports, selectDamageSummary, selectDamagedStockLoading, selectDamageSubmitSuccess, clearSubmitSuccess
} from '../../store/slices/damagedStockSlice';
import { fetchProducts, selectProducts } from '../../store/slices/productsSlice';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { cn } from '../../utils/cn';

const pageVariants = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

const DAMAGE_REASONS = [
  { value: 'expired', label: 'Expired' },
  { value: 'broken', label: 'Broken / Physical Damage' },
  { value: 'water_damage', label: 'Water Damage' },
  { value: 'fire_damage', label: 'Fire Damage' },
  { value: 'theft', label: 'Theft / Pilferage' },
  { value: 'handling_error', label: 'Handling Error' },
  { value: 'quality_issue', label: 'Quality Issue' },
  { value: 'other', label: 'Other' },
];

const TABS = [
  { key: 'history', label: 'Damage History' },
  { key: 'report', label: 'Report Damage' },
  { key: 'summary', label: 'Analytics' },
];

const EMPTY_FORM = { productId: '', quantity: '', reason: 'other' };

export default function DamagedStockPage() {
  const dispatch = useDispatch();
  const reports = useSelector(selectDamageReports);
  const summary = useSelector(selectDamageSummary);
  const loading = useSelector(selectDamagedStockLoading);
  const submitSuccess = useSelector(selectDamageSubmitSuccess);
  const products = useSelector(selectProducts);
  const activeShop = JSON.parse(localStorage.getItem('aroma_active_shop') || '{}');

  const [activeTab, setActiveTab] = useState('history');
  const [form, setForm] = useState(EMPTY_FORM);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  useEffect(() => {
    dispatch(fetchDamageReports({}));
    dispatch(fetchDamageSummary({}));
    dispatch(fetchProducts());
  }, [dispatch]);

  useEffect(() => {
    if (submitSuccess) {
      setForm(EMPTY_FORM);
      setActiveTab('history');
      dispatch(fetchDamageReports({}));
      dispatch(fetchDamageSummary({}));
      dispatch(clearSubmitSuccess());
    }
  }, [submitSuccess, dispatch]);

  const handleFilterByDate = () => {
    const params = {};
    if (dateRange.start) params.startDate = dateRange.start;
    if (dateRange.end) params.endDate = dateRange.end;
    dispatch(fetchDamageReports(params));
    dispatch(fetchDamageSummary(params));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const shopId = activeShop?.id;
    await dispatch(reportDamage({
      shopId,
      productId: form.productId,
      quantity: parseFloat(form.quantity),
      reason: form.reason
    }));
  };

  const columns = [
    {
      key: 'product', label: 'Product',
      render: (_, row) => (
        <div>
          <p className="font-medium text-navy">{row.product?.name || '—'}</p>
          <p className="text-xs text-grayMid">{row.product?.skuCode || '—'}</p>
        </div>
      ),
    },
    {
      key: 'quantity', label: 'Qty Lost',
      render: (v) => <span className="font-semibold text-red-600">{v}</span>,
    },
    {
      key: 'valueLost', label: 'Value Lost',
      render: (v) => <span className="font-semibold text-red-600">{formatCurrency(v || 0)}</span>,
    },
    {
      key: 'reason', label: 'Reason',
      render: (v) => {
        const label = DAMAGE_REASONS.find(r => r.value === v)?.label || v || '—';
        return <span className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded-lg">{label}</span>;
      },
    },
    {
      key: 'reporter', label: 'Reported By',
      render: (_, row) => <span className="text-xs text-grayMid">{row.reporter?.name || '—'}</span>,
    },
    {
      key: 'createdAt', label: 'Date',
      render: (v) => <span className="text-xs text-grayMid">{formatDate(v)}</span>,
    },
  ];

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" className="space-y-5">
      <PageHeader title="Damaged Stock" subtitle="Track, report, and analyze inventory losses" />

      {/* Warning Banner */}
      <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-3">
        <AlertOctagon size={18} className="text-red-500 shrink-0 mt-0.5" />
        <p className="text-sm text-red-700">All damage events are permanently recorded and deducted from stock. This data feeds into your business analytics and AI reports.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white border border-border rounded-2xl p-1.5">
        {TABS.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={cn('flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-all',
              activeTab === tab.key ? 'bg-red-500 text-white' : 'text-grayMid hover:text-navy hover:bg-bg'
            )}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {/* Date filter */}
          <div className="flex flex-wrap items-end gap-3 p-4 bg-white border border-border rounded-xl">
            <div>
              <label className="text-xs text-grayMid font-medium mb-1 block">From</label>
              <input type="date" value={dateRange.start} onChange={e => setDateRange(r => ({ ...r, start: e.target.value }))}
                className="px-3 py-2 rounded-xl border border-border bg-bg text-sm focus:outline-none focus:border-navy/40" />
            </div>
            <div>
              <label className="text-xs text-grayMid font-medium mb-1 block">To</label>
              <input type="date" value={dateRange.end} onChange={e => setDateRange(r => ({ ...r, end: e.target.value }))}
                className="px-3 py-2 rounded-xl border border-border bg-bg text-sm focus:outline-none focus:border-navy/40" />
            </div>
            <button onClick={handleFilterByDate} className="btn-primary py-2 text-sm">Filter</button>
            <button onClick={() => { setDateRange({ start: '', end: '' }); dispatch(fetchDamageReports({})); dispatch(fetchDamageSummary({})); }}
              className="px-3 py-2 rounded-xl border border-border text-sm text-grayMid hover:bg-bg">Reset</button>
          </div>
          <DataTable columns={columns} data={reports} loading={loading} emptyMessage="No damage reports in this period" />
        </div>
      )}

      {/* Report Damage Tab */}
      {activeTab === 'report' && (
        <div className="max-w-lg">
          <div className="card">
            <h3 className="font-display font-semibold text-navy mb-4">Report a Damage Event</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-grayMid font-medium mb-1 block">Product *</label>
                <select required value={form.productId} onChange={e => setForm(f => ({ ...f, productId: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-bg text-sm focus:outline-none focus:border-navy/50">
                  <option value="">Select product...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (Stock: {p.currentStock})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-grayMid font-medium mb-1 block">Quantity Damaged *</label>
                <input required type="number" min="1" step="0.01" value={form.quantity}
                  onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-bg text-sm focus:outline-none focus:border-navy/50"
                  placeholder="e.g. 5" />
              </div>
              <div>
                <label className="text-xs text-grayMid font-medium mb-1 block">Damage Reason *</label>
                <select value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-bg text-sm focus:outline-none focus:border-navy/50">
                  {DAMAGE_REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
                ⚠️ This will permanently deduct the quantity from current stock and log the financial loss.
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold transition-colors disabled:opacity-50">
                {loading ? 'Reporting...' : 'Submit Damage Report'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'summary' && summary && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="card border-red-200 bg-red-50">
              <p className="text-xs text-red-600 uppercase tracking-wide mb-1">Total Events</p>
              <p className="font-display font-bold text-3xl text-red-700">{summary.totalEvents}</p>
            </div>
            <div className="card border-red-200 bg-red-50">
              <p className="text-xs text-red-600 uppercase tracking-wide mb-1">Total Value Lost</p>
              <p className="font-display font-bold text-3xl text-red-700">{formatCurrency(summary.totalValueLost)}</p>
            </div>
            <div className="card">
              <p className="text-xs text-grayMid uppercase tracking-wide mb-1">Total Units Lost</p>
              <p className="font-display font-bold text-3xl text-navy">{summary.totalQuantityLost}</p>
            </div>
          </div>

          {/* Most damaged products */}
          {summary.mostDamagedProducts?.length > 0 && (
            <div className="card">
              <h3 className="font-display font-semibold text-navy mb-4">Most Damaged Products</h3>
              <div className="space-y-3">
                {summary.mostDamagedProducts.slice(0, 8).map((p, i) => (
                  <div key={p.productId} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-grayMid w-6">{i + 1}</span>
                      <div>
                        <p className="font-medium text-navy text-sm">{p.name}</p>
                        <p className="text-xs text-grayMid">{p.skuCode} • {p.events} event{p.events !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-red-600">{formatCurrency(p.totalValue)}</p>
                      <p className="text-xs text-grayMid">{p.totalQty} units</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Damage by reason */}
          {summary.damageByReason?.length > 0 && (
            <div className="card">
              <h3 className="font-display font-semibold text-navy mb-4">Damage by Reason</h3>
              <div className="flex flex-wrap gap-3">
                {summary.damageByReason.map(r => {
                  const label = DAMAGE_REASONS.find(dr => dr.value === r.reason)?.label || r.reason;
                  return (
                    <div key={r.reason} className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-100 rounded-xl">
                      <span className="text-sm text-red-700 font-medium">{label}</span>
                      <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">{r.count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
