import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { ArrowLeft, ClipboardList, Send, Barcode, Tag, Truck, Info } from 'lucide-react';
import { submitProductRequest } from '../../store/slices/productRequestsSlice';

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function NewProductRequestPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    description: '',
    barcodes: '',
    suggestedPrice: '',
    categoryHint: '',
    quantity: '',
    supplierHint: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const set = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Product name is required'); return; }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      barcodes: form.barcodes.trim() || undefined,
      suggestedPrice: form.suggestedPrice ? parseFloat(form.suggestedPrice) : undefined,
      categoryHint: form.categoryHint.trim() || undefined,
      quantity: form.quantity ? parseFloat(form.quantity) : undefined,
      supplierHint: form.supplierHint.trim() || undefined,
    };

    setSubmitting(true);
    const result = await dispatch(submitProductRequest(payload));
    setSubmitting(false);

    if (submitProductRequest.fulfilled.match(result)) {
      toast.success(`✓ Request for "${form.name}" submitted! A manager will review it shortly.`);
      navigate('/products/requests');
    } else {
      toast.error(result.payload || 'Failed to submit request');
    }
  };

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/products/requests')}
          className="p-2 rounded-xl hover:bg-navy/5 transition-colors text-grayMid hover:text-navy"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="font-display font-bold text-2xl text-navy">Request New Product</h1>
          <p className="text-grayMid text-sm mt-0.5">
            Fill in the details you know — a Manager will verify pricing, SKU & category before adding to the catalog.
          </p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 px-5 py-4 bg-blue-50 border border-blue-200 rounded-2xl">
        <Info size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
        <div className="text-sm">
          <p className="font-semibold text-blue-800">How this works</p>
          <ol className="text-blue-600 text-xs mt-1 space-y-0.5 list-decimal list-inside">
            <li>You fill in what you know about the product</li>
            <li>A Manager or Admin reviews and approves it</li>
            <li>On approval, the product is automatically added to the catalog with full details</li>
          </ol>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        {/* Product Name */}
        <div>
          <label className="block text-sm font-semibold text-navy mb-1.5">
            Product Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="e.g. Coca Cola 500ml, Lays Classic 50g..."
            className="input-base"
            required
          />
          <p className="text-xs text-grayMid mt-1">Be as specific as possible including size, variant, or brand</p>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-navy mb-1.5">Description</label>
          <textarea
            rows={2}
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Any extra details about the product..."
            className="input-base resize-none"
          />
        </div>

        {/* Barcode */}
        <div>
          <label className="block text-sm font-medium text-navy mb-1.5 flex items-center gap-1.5">
            <Barcode size={14} className="text-grayMid" /> Barcode / EAN
          </label>
          <input
            type="text"
            value={form.barcodes}
            onChange={(e) => set('barcodes', e.target.value)}
            placeholder="Scan or type the barcode (if available)"
            className="input-base font-mono"
          />
        </div>

        {/* Category Hint & Suggested Price */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-navy mb-1.5 flex items-center gap-1.5">
              <Tag size={14} className="text-grayMid" /> Category (your best guess)
            </label>
            <input
              type="text"
              value={form.categoryHint}
              onChange={(e) => set('categoryHint', e.target.value)}
              placeholder="e.g. Beverages, Snacks, Dairy..."
              className="input-base"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1.5">Suggested Price (₹)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.suggestedPrice}
              onChange={(e) => set('suggestedPrice', e.target.value)}
              placeholder="e.g. 40"
              className="input-base"
            />
          </div>
        </div>

        {/* Quantity & Supplier */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-navy mb-1.5">Expected Quantity</label>
            <input
              type="number"
              min="0"
              step="any"
              value={form.quantity}
              onChange={(e) => set('quantity', e.target.value)}
              placeholder="How many units are arriving?"
              className="input-base"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1.5 flex items-center gap-1.5">
              <Truck size={14} className="text-grayMid" /> Supplier / Source
            </label>
            <input
              type="text"
              value={form.supplierHint}
              onChange={(e) => set('supplierHint', e.target.value)}
              placeholder="e.g. Raj Traders, Mumbai Distributor..."
              className="input-base"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2 border-t border-border">
          <button
            type="button"
            onClick={() => navigate('/products/requests')}
            className="btn-secondary flex-1 sm:flex-none sm:min-w-[120px] justify-center"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !form.name.trim()}
            className="btn-primary flex-1 justify-center sm:min-w-[180px]"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Submitting...
              </span>
            ) : (
              <><Send size={15} /> Submit Request</>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
