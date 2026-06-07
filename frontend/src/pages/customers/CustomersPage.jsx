import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, X, Phone, Mail, MapPin, ShoppingBag, TrendingUp, ChevronRight } from 'lucide-react';
import {
  fetchCustomers, createCustomer, updateCustomer, deleteCustomer, fetchCustomerById,
  selectCustomers, selectSelectedCustomer, selectCustomersLoading, clearSelectedCustomer
} from '../../store/slices/customersSlice';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useSelector as useAuthSelector } from 'react-redux';

const pageVariants = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0, transition: { duration: 0.3 } } };
const drawerVariants = { hidden: { x: '100%', opacity: 0 }, visible: { x: 0, opacity: 1, transition: { type: 'spring', damping: 28, stiffness: 300 } } };

const EMPTY_FORM = { name: '', phone: '', email: '', address: '', notes: '' };

export default function CustomersPage() {
  const dispatch = useDispatch();
  const customers = useSelector(selectCustomers);
  const selected = useSelector(selectSelectedCustomer);
  const loading = useSelector(selectCustomersLoading);
  const activeShop = JSON.parse(localStorage.getItem('aroma_active_shop') || '{}');

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    dispatch(fetchCustomers());
  }, [dispatch]);

  const filtered = customers.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    const shopId = activeShop?.id;
    if (editingId) {
      await dispatch(updateCustomer({ id: editingId, data: form }));
    } else {
      await dispatch(createCustomer({ ...form, shopId }));
    }
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const openEdit = (c) => {
    setEditingId(c.id);
    setForm({ name: c.name, phone: c.phone || '', email: c.email || '', address: c.address || '', notes: c.notes || '' });
    setShowForm(true);
  };

  const openDrawer = (id) => {
    dispatch(fetchCustomerById(id));
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    dispatch(clearSelectedCustomer());
  };

  const columns = [
    {
      key: 'name', label: 'Customer',
      render: (v, row) => (
        <div>
          <p className="font-medium text-navy">{v}</p>
          <p className="text-xs text-grayMid">{row.phone || row.email || '—'}</p>
        </div>
      ),
    },
    {
      key: 'totalPurchases', label: 'Orders',
      render: (v) => <span className="font-semibold text-center">{v ?? 0}</span>,
    },
    {
      key: 'totalSpent', label: 'Total Spent',
      render: (v) => <span className="font-semibold text-navy">{formatCurrency(v || 0)}</span>,
    },
    {
      key: 'createdAt', label: 'Since',
      render: (v) => <span className="text-grayMid text-xs">{formatDate(v)}</span>,
    },
    {
      key: 'actions', label: '',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button onClick={() => openEdit(row)} className="text-xs text-grayMid hover:text-navy transition-colors">Edit</button>
          <button onClick={() => openDrawer(row.id)} className="text-xs text-navy font-medium hover:text-neon transition-colors flex items-center gap-1">
            History <ChevronRight size={12} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" className="space-y-5">
      <PageHeader
        title="Customers"
        subtitle={`${customers.length} registered customers`}
        action={
          <button onClick={() => { setShowForm(true); setEditingId(null); setForm(EMPTY_FORM); }} className="btn-primary">
            <Plus size={16} /> Add Customer
          </button>
        }
      />

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-xs text-grayMid uppercase tracking-wide mb-1">Total Customers</p>
          <p className="font-display font-bold text-2xl text-navy">{customers.length}</p>
        </div>
        <div className="card border-neon/30 bg-neon/5">
          <p className="text-xs text-grayMid uppercase tracking-wide mb-1">Total Revenue</p>
          <p className="font-display font-bold text-2xl text-navy">{formatCurrency(customers.reduce((a, c) => a + (c.totalSpent || 0), 0))}</p>
        </div>
        <div className="card">
          <p className="text-xs text-grayMid uppercase tracking-wide mb-1">Avg. Spend</p>
          <p className="font-display font-bold text-2xl text-navy">
            {formatCurrency(customers.length > 0 ? customers.reduce((a, c) => a + (c.totalSpent || 0), 0) / customers.length : 0)}
          </p>
        </div>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search by name, phone, or email..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-sm focus:outline-none focus:border-navy/40 transition-colors"
      />

      {/* Table */}
      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        emptyMessage="No customers yet — add your first customer"
      />

      {/* Add/Edit form modal */}
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
                <h2 className="font-display font-bold text-xl text-navy">{editingId ? 'Edit Customer' : 'Add Customer'}</h2>
                <button onClick={() => setShowForm(false)} className="text-grayMid hover:text-navy"><X size={20} /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs text-grayMid font-medium mb-1 block">Name *</label>
                  <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-bg text-sm focus:outline-none focus:border-navy/50" placeholder="Customer name" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-grayMid font-medium mb-1 block">Phone</label>
                    <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-bg text-sm focus:outline-none focus:border-navy/50" placeholder="Phone number" />
                  </div>
                  <div>
                    <label className="text-xs text-grayMid font-medium mb-1 block">Email</label>
                    <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-bg text-sm focus:outline-none focus:border-navy/50" placeholder="Email" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-grayMid font-medium mb-1 block">Address</label>
                  <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-bg text-sm focus:outline-none focus:border-navy/50" placeholder="Address" />
                </div>
                <div>
                  <label className="text-xs text-grayMid font-medium mb-1 block">Notes</label>
                  <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    rows={2} className="w-full px-4 py-2.5 rounded-xl border border-border bg-bg text-sm focus:outline-none focus:border-navy/50 resize-none" placeholder="Internal notes..." />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm text-grayMid hover:bg-bg transition-colors">Cancel</button>
                  <button type="submit" className="flex-1 btn-primary">{editingId ? 'Save Changes' : 'Add Customer'}</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Purchase History Drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/30" onClick={closeDrawer} />
            <motion.div variants={drawerVariants} initial="hidden" animate="visible" exit="hidden"
              className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-lg bg-white shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-border">
                <div>
                  <h3 className="font-display font-bold text-xl text-navy">{selected?.name || 'Customer'}</h3>
                  <p className="text-xs text-grayMid">{selected?.email || selected?.phone || 'No contact info'}</p>
                </div>
                <button onClick={closeDrawer} className="text-grayMid hover:text-navy p-2"><X size={20} /></button>
              </div>

              {selected && (
                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="card bg-neon/5 border-neon/20">
                      <div className="flex items-center gap-2 mb-1"><ShoppingBag size={14} className="text-neon" /><p className="text-xs text-grayMid">Total Orders</p></div>
                      <p className="font-bold text-2xl text-navy">{selected.totalPurchases}</p>
                    </div>
                    <div className="card">
                      <div className="flex items-center gap-2 mb-1"><TrendingUp size={14} className="text-navy" /><p className="text-xs text-grayMid">Total Spent</p></div>
                      <p className="font-bold text-2xl text-navy">{formatCurrency(selected.totalSpent || 0)}</p>
                    </div>
                  </div>

                  {/* Contact */}
                  {(selected.phone || selected.email || selected.address) && (
                    <div className="card space-y-2">
                      <p className="text-xs font-medium text-grayMid uppercase tracking-wide mb-3">Contact Info</p>
                      {selected.phone && <div className="flex items-center gap-2 text-sm text-navy"><Phone size={14} className="text-grayMid" />{selected.phone}</div>}
                      {selected.email && <div className="flex items-center gap-2 text-sm text-navy"><Mail size={14} className="text-grayMid" />{selected.email}</div>}
                      {selected.address && <div className="flex items-center gap-2 text-sm text-navy"><MapPin size={14} className="text-grayMid" />{selected.address}</div>}
                    </div>
                  )}

                  {/* Purchase History */}
                  <div>
                    <p className="text-xs font-medium text-grayMid uppercase tracking-wide mb-3">Purchase History</p>
                    {selected.sales?.length === 0 ? (
                      <p className="text-sm text-grayMid text-center py-6">No purchases recorded yet</p>
                    ) : (
                      <div className="space-y-3">
                        {(selected.sales || []).map(sale => (
                          <div key={sale.id} className="card hover:border-navy/20 transition-colors">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-mono text-xs text-grayMid bg-bg px-2 py-1 rounded-lg">#{String(sale.id).slice(-8).toUpperCase()}</span>
                              <span className="font-semibold text-navy">{formatCurrency(sale.totalAmount)}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-grayMid">
                              <span>{sale.items?.length} item{sale.items?.length !== 1 ? 's' : ''}</span>
                              <span>{formatDate(sale.createdAt)}</span>
                            </div>
                            {sale.items?.slice(0, 3).map(item => (
                              <p key={item.id} className="text-xs text-grayMid mt-1">• {item.product?.name} × {item.quantity}</p>
                            ))}
                            {sale.items?.length > 3 && <p className="text-xs text-grayMid">+{sale.items.length - 3} more...</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
