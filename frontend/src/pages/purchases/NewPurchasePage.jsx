import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { Plus, Trash2 } from 'lucide-react';
import { fetchProducts, selectProducts } from '../../store/slices/productsSlice';
import { createPurchase } from '../../store/slices/purchasesSlice';
import { fetchShops, selectShops } from '../../store/slices/shopsSlice';
import { formatCurrency } from '../../utils/formatters';
import { toast } from 'sonner';
import { cn } from '../../utils/cn';

const pageVariants = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

export default function NewPurchasePage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const products = useSelector(selectProducts);
  const shops = useSelector(selectShops);

  const [supplierName, setSupplierName] = useState('');
  const [shopId, setShopId] = useState('');
  const [rows, setRows] = useState([{ productId: '', quantity: 1, purchasePrice: 0 }]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchShops());
  }, [dispatch]);

  useEffect(() => {
    if (shops.length === 1) setShopId(shops[0].id);
  }, [shops]);

  const addRow = () => setRows((r) => [...r, { productId: '', quantity: 1, purchasePrice: 0 }]);

  const updateRow = (idx, field, value) => {
    setRows((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      // Auto-fill purchase price
      if (field === 'productId') {
        const product = products.find((p) => p.id === value);
        if (product) next[idx].purchasePrice = product.purchasePrice || 0;
      }
      return next;
    });
  };

  const removeRow = (idx) => setRows((r) => r.filter((_, i) => i !== idx));

  const total = rows.reduce((sum, r) => sum + (Number(r.purchasePrice) || 0) * (Number(r.quantity) || 0), 0);

  const handleSubmit = async () => {
    if (!shopId) { toast.error('Select a shop'); return; }
    const validRows = rows.filter((r) => r.productId && r.quantity > 0);
    if (validRows.length === 0) { toast.error('Add at least one product'); return; }

    setSubmitting(true);
    const payload = {
      shopId,
      supplierName: supplierName || undefined,
      items: validRows.map(({ productId, quantity, purchasePrice }) => ({
        productId, quantity: Number(quantity), purchasePrice: Number(purchasePrice),
      })),
    };

    const result = await dispatch(createPurchase(payload));
    setSubmitting(false);
    if (createPurchase.fulfilled.match(result)) {
      toast.success('Purchase recorded!');
      const id = result.payload?.purchase?.id || result.payload?.id;
      if (id) navigate(`/purchases/${id}`);
      else navigate('/purchases');
    } else {
      toast.error(result.payload || 'Failed to record purchase');
    }
  };

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" className="max-w-3xl mx-auto space-y-5">
      <h1 className="font-display font-bold text-2xl text-navy">New Purchase</h1>

      <div className="card space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-navy mb-1.5">Supplier Name</label>
            <input
              type="text"
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              placeholder="e.g. ABC Wholesale"
              className="input-base"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1.5">
              Shop <span className="text-red-500">*</span>
            </label>
            <select value={shopId} onChange={(e) => setShopId(e.target.value)} className="input-base">
              <option value="">Select shop</option>
              {shops.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>

        {/* Product Rows */}
        <div>
          <h3 className="font-display font-semibold text-navy mb-3">Products</h3>
          <div className="space-y-3">
            <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-grayMid uppercase tracking-wide px-1">
              <span className="col-span-5">Product</span>
              <span className="col-span-2 text-center">Qty</span>
              <span className="col-span-3">Purchase Price</span>
              <span className="col-span-1 text-center">Sub</span>
              <span className="col-span-1" />
            </div>

            {rows.map((row, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-bg rounded-xl p-2 border border-border">
                <select
                  value={row.productId}
                  onChange={(e) => updateRow(idx, 'productId', e.target.value)}
                  className="col-span-5 input-base py-2 text-sm"
                >
                  <option value="">Select product</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <input
                  type="number"
                  value={row.quantity}
                  min="1"
                  onChange={(e) => updateRow(idx, 'quantity', e.target.value)}
                  className="col-span-2 input-base text-center py-2 text-sm"
                />
                <input
                  type="number"
                  value={row.purchasePrice}
                  step="0.01"
                  onChange={(e) => updateRow(idx, 'purchasePrice', e.target.value)}
                  className="col-span-3 input-base py-2 text-sm"
                />
                <span className="col-span-1 text-xs font-semibold text-navy text-center">
                  {formatCurrency((Number(row.purchasePrice) || 0) * (Number(row.quantity) || 0))}
                </span>
                <button
                  onClick={() => removeRow(idx)}
                  disabled={rows.length === 1}
                  className="col-span-1 flex justify-center text-grayMid hover:text-red-600 transition-colors disabled:opacity-30"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          <button onClick={addRow} className="btn-secondary mt-3 text-sm">
            <Plus size={14} /> Add Row
          </button>
        </div>

        {/* Total */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <span className="font-display font-semibold text-lg text-navy">Total</span>
          <span className="font-display font-bold text-2xl text-neon">{formatCurrency(total)}</span>
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="btn-primary w-full justify-center py-3"
        >
          {submitting ? 'Recording...' : 'Record Purchase'}
        </button>
      </div>
    </motion.div>
  );
}
