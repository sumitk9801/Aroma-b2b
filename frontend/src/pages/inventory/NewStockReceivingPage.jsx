import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Plus, Trash2, PackageCheck, Truck, ArrowLeft,
  ChevronDown, Search, Box, ClipboardList
} from 'lucide-react';
import { receiveStock, clearReceiveResult } from '../../store/slices/stockMovementsSlice';
import { fetchProducts, selectProducts } from '../../store/slices/productsSlice';
import { selectActiveShopId } from '../../store/slices/uiSlice';
import { cn } from '../../utils/cn';

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const emptyItem = () => ({ productId: '', quantity: '' });

export default function NewStockReceivingPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const products = useSelector(selectProducts);
  const activeShopId = useSelector(selectActiveShopId);

  const [supplierName, setSupplierName] = useState('');
  const [deliveryNote, setDeliveryNote] = useState('');
  const [generalNote, setGeneralNote] = useState('');
  const [items, setItems] = useState([emptyItem()]);
  const [submitting, setSubmitting] = useState(false);
  const [productSearch, setProductSearch] = useState({});

  useEffect(() => {
    dispatch(fetchProducts());
    return () => dispatch(clearReceiveResult());
  }, [dispatch]);

  // Filter products for a given row index
  const getFilteredProducts = (idx) => {
    const search = (productSearch[idx] || '').toLowerCase();
    if (!search) return products;
    return products.filter(
      (p) =>
        p.name?.toLowerCase().includes(search) ||
        p.skuCode?.toLowerCase().includes(search)
    );
  };

  const addItem = () => setItems((prev) => [...prev, emptyItem()]);

  const removeItem = (idx) =>
    setItems((prev) => prev.filter((_, i) => i !== idx));

  const updateItem = (idx, field, value) =>
    setItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    );

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate
    const invalidItems = items.filter(
      (it) => !it.productId || !it.quantity || parseFloat(it.quantity) <= 0
    );
    if (invalidItems.length > 0) {
      toast.error('Please fill in all products and valid quantities.');
      return;
    }

    const payload = {
      shopId: activeShopId,
      supplierName: supplierName.trim() || undefined,
      deliveryNote: deliveryNote.trim() || undefined,
      note: generalNote.trim() || undefined,
      items: items.map((it) => ({
        productId: it.productId,
        quantity: parseFloat(it.quantity),
      })),
    };

    setSubmitting(true);
    const result = await dispatch(receiveStock(payload));
    setSubmitting(false);

    if (receiveStock.fulfilled.match(result)) {
      const count = Array.isArray(result.payload) ? result.payload.length : 1;
      toast.success(`✓ ${count} product${count !== 1 ? 's' : ''} received into stock!`);
      navigate('/inventory/receiving');
    } else {
      toast.error(result.payload || 'Failed to record stock receiving');
    }
  };

  const totalItems = items.filter((it) => it.productId && it.quantity).length;

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/inventory/receiving')}
          className="p-2 rounded-xl hover:bg-navy/5 transition-colors text-grayMid hover:text-navy"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="font-display font-bold text-2xl text-navy">Receive Goods</h1>
          <p className="text-grayMid text-sm mt-0.5">Record physical delivery and update inventory stock levels</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Shipment Details Card */}
        <div className="card p-6 space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-border">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center">
              <Truck size={16} className="text-blue-500" />
            </div>
            <div>
              <h2 className="font-semibold text-navy text-base">Shipment Details</h2>
              <p className="text-xs text-grayMid">Optional supplier and delivery information</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="supplierName" className="block text-sm font-medium text-navy mb-1.5">Supplier Name</label>
              <input
                id="supplierName"
                name="supplierName"
                type="text"
                autoComplete="off"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                placeholder="e.g. Raj Traders, Mumbai Distributors..."
                className="input-base"
              />
            </div>
            <div>
              <label htmlFor="deliveryNote" className="block text-sm font-medium text-navy mb-1.5">Delivery Note / GRN No.</label>
              <input
                id="deliveryNote"
                name="deliveryNote"
                type="text"
                autoComplete="off"
                value={deliveryNote}
                onChange={(e) => setDeliveryNote(e.target.value)}
                placeholder="e.g. DN-2024-001, GRN-456..."
                className="input-base"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-navy mb-1.5">Notes / Remarks</label>
            <textarea
              value={generalNote}
              onChange={(e) => setGeneralNote(e.target.value)}
              rows={2}
              placeholder="Any delivery remarks, condition of goods, partial delivery notes..."
              className="input-base resize-none"
            />
          </div>
        </div>

        {/* Items Card */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-neon/10 border border-neon/20 flex items-center justify-center">
                <ClipboardList size={16} className="text-neon" />
              </div>
              <div>
                <h2 className="font-semibold text-navy text-base">Received Items</h2>
                <p className="text-xs text-grayMid">{totalItems} item{totalItems !== 1 ? 's' : ''} ready to receive</p>
              </div>
            </div>
            <button
              type="button"
              onClick={addItem}
              className="btn-secondary text-sm"
            >
              <Plus size={15} /> Add Item
            </button>
          </div>

          {/* Table Header */}
          <div className="hidden sm:grid grid-cols-[2fr_1fr_auto] gap-3 px-1">
            <span className="text-xs font-semibold text-grayMid uppercase tracking-wide">Product</span>
            <span className="text-xs font-semibold text-grayMid uppercase tracking-wide">Qty Received</span>
            <span className="w-8" />
          </div>

          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {items.map((item, idx) => {
                const selectedProduct = products.find((p) => p.id === item.productId);
                const filtered = getFilteredProducts(idx);

                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_auto] gap-3 items-start p-4 rounded-2xl border border-border bg-bg/50"
                  >
                    {/* Product Select */}
                    <div className="space-y-2">
                      <label className="block sm:hidden text-xs font-semibold text-grayMid uppercase tracking-wide">Product</label>
                      <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-grayMid pointer-events-none" />
                        <input
                          type="text"
                          placeholder="Search product..."
                          value={productSearch[idx] || ''}
                          onChange={(e) => setProductSearch((prev) => ({ ...prev, [idx]: e.target.value }))}
                          className="input-base !pl-9 py-2 text-sm"
                        />
                      </div>
                      <select
                        value={item.productId}
                        onChange={(e) => {
                          updateItem(idx, 'productId', e.target.value);
                          setProductSearch((prev) => ({ ...prev, [idx]: '' }));
                        }}
                        className={cn(
                          'input-base py-2 text-sm',
                          !item.productId && 'text-grayMid'
                        )}
                      >
                        <option value="">— Select product —</option>
                        {filtered.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} (Stock: {p.currentStock ?? 0})
                          </option>
                        ))}
                      </select>
                      {selectedProduct && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-border rounded-xl text-xs text-grayMid">
                          <Box size={12} className="text-neon" />
                          Current stock: <strong className="text-navy ml-1">{selectedProduct.currentStock ?? 0}</strong>
                          {item.quantity && (
                            <span className="ml-auto text-green-700 font-bold">
                              → {(selectedProduct.currentStock ?? 0) + parseFloat(item.quantity || 0)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Quantity */}
                    <div className="space-y-1">
                      <label className="block sm:hidden text-xs font-semibold text-grayMid uppercase tracking-wide">Qty Received</label>
                      <input
                        type="number"
                        min="0.001"
                        step="any"
                        value={item.quantity}
                        onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                        placeholder="e.g. 50"
                        className={cn(
                          'input-base py-2 text-sm font-semibold',
                          !item.quantity && 'text-grayMid'
                        )}
                      />
                    </div>

                    {/* Remove */}
                    <div className="flex items-center justify-end sm:justify-center pt-0 sm:pt-2">
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        disabled={items.length === 1}
                        className="p-2 rounded-xl hover:bg-red-50 text-grayMid hover:text-red-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Remove item"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Summary Footer */}
          {totalItems > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-2 flex items-center justify-between px-4 py-3 bg-neon/5 border border-neon/20 rounded-xl"
            >
              <span className="text-sm font-medium text-navy">
                Ready to receive <strong>{totalItems}</strong> product line{totalItems !== 1 ? 's' : ''}
              </span>
              {supplierName && (
                <span className="text-xs text-grayMid">from <strong className="text-navy">{supplierName}</strong></span>
              )}
            </motion.div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-end">
          <button
            type="button"
            onClick={() => navigate('/inventory/receiving')}
            className="btn-secondary sm:w-auto justify-center"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || totalItems === 0}
            className="btn-primary sm:w-auto justify-center min-w-[180px]"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Recording...
              </span>
            ) : (
              <>
                <PackageCheck size={16} />
                Confirm Receipt
              </>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
