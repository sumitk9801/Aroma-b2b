import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Truck, Plus, X, Phone, Mail, MapPin, Package, ChevronRight } from 'lucide-react';
import {
  fetchSuppliers, createSupplier, updateSupplier, deleteSupplier, fetchSupplierById,
  selectSuppliers, selectSelectedSupplier, selectSuppliersLoading, clearSelectedSupplier
} from '../../store/slices/suppliersSlice';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import { formatCurrency, formatDate } from '../../utils/formatters';

const pageVariants = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0, transition: { duration: 0.3 } } };
const drawerVariants = { hidden: { x: '100%', opacity: 0 }, visible: { x: 0, opacity: 1, transition: { type: 'spring', damping: 28, stiffness: 300 } } };
const EMPTY_FORM = { name: '', phone: '', email: '', address: '', notes: '' };

export default function SuppliersPage() {
  const dispatch = useDispatch();
  const suppliers = useSelector(selectSuppliers);
  const selected = useSelector(selectSelectedSupplier);
  const loading = useSelector(selectSuppliersLoading);
  const activeShop = JSON.parse(localStorage.getItem('aroma_active_shop') || '{}');

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => { dispatch(fetchSuppliers()); }, [dispatch]);

  const filtered = suppliers.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.phone?.includes(search) || s.email?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    const shopId = activeShop?.id;
    if (editingId) {
      await dispatch(updateSupplier({ id: editingId, data: form }));
    } else {
      await dispatch(createSupplier({ ...form, shopId }));
    }
    setShowForm(false); setEditingId(null); setForm(EMPTY_FORM);
  };

  const openEdit = (s) => {
    setEditingId(s.id);
    setForm({ name: s.name, phone: s.phone || '', email: s.email || '', address: s.address || '', notes: s.notes || '' });
    setShowForm(true);
  };

  const openDrawer = (id) => { dispatch(fetchSupplierById(id)); setDrawerOpen(true); };
  const closeDrawer = () => { setDrawerOpen(false); dispatch(clearSelectedSupplier()); };

  const columns = [
    {
      key: 'name', label: 'Supplier',
      render: (v, row) => (
        <div><p className="font-medium text-navy">{v}</p><p className="text-xs text-grayMid">{row.phone || row.email || '—'}</p></div>
      ),
    },
    { key: 'totalOrders', label: 'Orders', render: (v) => <span className="font-semibold">{v ?? 0}</span> },
    { key: 'totalSpent', label: 'Total Bought', render: (v) => <span className="font-semibold text-navy">{formatCurrency(v || 0)}</span> },
    { key: 'createdAt', label: 'Added', render: (v) => <span className="text-grayMid text-xs">{formatDate(v)}</span> },
    {
      key: 'actions', label: '',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button onClick={() => openEdit(row)} className="text-xs text-grayMid hover:text-navy transition-colors">Edit</button>
          <button onClick={() => openDrawer(row.id)} className="text-xs text-navy font-medium hover:text-neon transition-colors flex items-center gap-1">
            Orders <ChevronRight size={12} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" className="space-y-5">
      <PageHeader
        title="Suppliers"
        subtitle={`${suppliers.length} registered suppliers`}
        action={
          <button onClick={() => { setShowForm(true); setEditingId(null); setForm(EMPTY_FORM); }} className="btn-primary">
            <Plus size={16} /> Add Supplier
          </button>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="card"><p className="text-xs text-grayMid uppercase tracking-wide mb-1">Total Suppliers</p><p className="font-display font-bold text-2xl text-navy">{suppliers.length}</p></div>
        <div className="card border-neon/30 bg-neon/5"><p className="text-xs text-grayMid uppercase tracking-wide mb-1">Total Purchased</p><p className="font-display font-bold text-2xl text-navy">{formatCurrency(suppliers.reduce((a, s) => a + (s.totalSpent || 0), 0))}</p></div>
        <div className="card"><p className="text-xs text-grayMid uppercase tracking-wide mb-1">Total Orders</p><p className="font-display font-bold text-2xl text-navy">{suppliers.reduce((a, s) => a + (s.totalOrders || 0), 0)}</p></div>
      </div>

      <input type="text" placeholder="Search suppliers..." value={search} onChange={e => setSearch(e.target.value)}
        className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-sm focus:outline-none focus:border-navy/40 transition-colors" />

      <DataTable columns={columns} data={filtered} loading={loading} emptyMessage="No suppliers yet" />

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setShowForm(false)}
          >
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-display font-bold text-xl text-navy">{editingId ? 'Edit Supplier' : 'Add Supplier'}</h2>
                <button onClick={() => setShowForm(false)}><X size={20} className="text-grayMid" /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div><label className="text-xs text-grayMid font-medium mb-1 block">Name *</label>
                  <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-bg text-sm focus:outline-none focus:border-navy/50" placeholder="Supplier name" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs text-grayMid font-medium mb-1 block">Phone</label>
                    <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-bg text-sm focus:outline-none focus:border-navy/50" placeholder="Phone" /></div>
                  <div><label className="text-xs text-grayMid font-medium mb-1 block">Email</label>
                    <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-bg text-sm focus:outline-none focus:border-navy/50" placeholder="Email" /></div>
                </div>
                <div><label className="text-xs text-grayMid font-medium mb-1 block">Address</label>
                  <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-bg text-sm focus:outline-none focus:border-navy/50" placeholder="Address" /></div>
                <div><label className="text-xs text-grayMid font-medium mb-1 block">Notes</label>
                  <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    rows={2} className="w-full px-4 py-2.5 rounded-xl border border-border bg-bg text-sm focus:outline-none focus:border-navy/50 resize-none" placeholder="Notes..." /></div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm text-grayMid hover:bg-bg transition-colors">Cancel</button>
                  <button type="submit" className="flex-1 btn-primary">{editingId ? 'Save Changes' : 'Add Supplier'}</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Order History Drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black/30" onClick={closeDrawer} />
            <motion.div variants={drawerVariants} initial="hidden" animate="visible" exit="hidden"
              className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-lg bg-white shadow-2xl flex flex-col">
              <div className="flex items-center justify-between px-6 py-5 border-b border-border">
                <div>
                  <h3 className="font-display font-bold text-xl text-navy">{selected?.name}</h3>
                  <p className="text-xs text-grayMid">{selected?.email || selected?.phone || 'No contact'}</p>
                </div>
                <button onClick={closeDrawer}><X size={20} className="text-grayMid" /></button>
              </div>
              {selected && (
                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="card bg-neon/5 border-neon/20"><p className="text-xs text-grayMid mb-1">Total Orders</p><p className="font-bold text-2xl text-navy">{selected.totalOrders}</p></div>
                    <div className="card"><p className="text-xs text-grayMid mb-1">Total Spent</p><p className="font-bold text-2xl text-navy">{formatCurrency(selected.totalSpent || 0)}</p></div>
                  </div>
                  <p className="text-xs font-medium text-grayMid uppercase tracking-wide">Purchase History</p>
                  {(selected.purchases || []).length === 0 ? (
                    <p className="text-sm text-grayMid text-center py-6">No purchases recorded</p>
                  ) : (
                    <div className="space-y-3">
                      {(selected.purchases || []).map(p => (
                        <div key={p.id} className="card">
                          <div className="flex justify-between mb-2">
                            <span className="font-mono text-xs text-grayMid bg-bg px-2 py-1 rounded-lg">#{String(p.id).slice(-8).toUpperCase()}</span>
                            <span className="font-semibold text-navy">{formatCurrency(p.totalAmount)}</span>
                          </div>
                          <div className="flex justify-between text-xs text-grayMid">
                            <span>{p.items?.length} item{p.items?.length !== 1 ? 's' : ''}</span>
                            <span>{formatDate(p.createdAt)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
