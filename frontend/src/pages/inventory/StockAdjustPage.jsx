import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Plus, Minus } from 'lucide-react';
import { adjustStock, clearAdjustResult, selectAdjustResult } from '../../store/slices/stockMovementsSlice';
import { fetchProducts, selectProducts } from '../../store/slices/productsSlice';
import PageHeader from '../../components/ui/PageHeader';
import { REFERENCE_TYPES } from '../../utils/constants';
import { cn } from '../../utils/cn';

const schema = z.object({
  productId: z.string().min(1, 'Select a product'),
  type: z.enum(['addition', 'reduction']),
  quantity: z.coerce.number().int().positive('Quantity must be at least 1'),
  reason: z.string().min(1, 'Reason is required'),
  referenceType: z.string().min(1, 'Select a reference type'),
});

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function StockAdjustPage() {
  const dispatch = useDispatch();
  const products = useSelector(selectProducts);
  const adjustResult = useSelector(selectAdjustResult);

  const { register, handleSubmit, watch, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { type: 'addition', referenceType: 'manual' },
  });

  const selectedProductId = watch('productId');
  const selectedType = watch('type');
  const selectedProduct = products.find((p) => p.id === selectedProductId);

  useEffect(() => {
    dispatch(fetchProducts());
    return () => dispatch(clearAdjustResult());
  }, [dispatch]);

  const onSubmit = async (data) => {
    const result = await dispatch(adjustStock(data));
    if (adjustStock.fulfilled.match(result)) {
      toast.success(`Stock ${data.type === 'addition' ? 'added' : 'reduced'} successfully!`);
      reset({ type: 'addition', referenceType: 'manual' });
    } else {
      toast.error(result.payload || 'Stock adjustment failed');
    }
  };

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate">
      <PageHeader title="Stock Adjustment" subtitle="Manually add or remove stock from a product" />

      <div className="max-w-lg mx-auto">
        <div className="card p-8 space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Product Select */}
            <div>
              <label className="block text-sm font-medium text-navy mb-1.5">
                Product <span className="text-red-500">*</span>
              </label>
              <select {...register('productId')} className={cn('input-base', errors.productId && 'border-red-400')}>
                <option value="">Search and select product...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Stock: {p.currentStock ?? 0})
                  </option>
                ))}
              </select>
              {errors.productId && <p className="text-red-500 text-xs mt-1">{errors.productId.message}</p>}

              {selectedProduct && (
                <div className="mt-2 bg-bg rounded-xl px-4 py-2 border border-border">
                  <p className="text-xs text-grayMid">
                    Current stock: <strong className="text-navy">{selectedProduct.currentStock ?? 0}</strong>
                    {' '}| Minimum: <strong className="text-navy">{selectedProduct.minimumStock ?? 0}</strong>
                  </p>
                </div>
              )}
            </div>

            {/* Adjustment Type */}
            <div>
              <label className="block text-sm font-medium text-navy mb-2">
                Adjustment Type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'addition', label: 'Add Stock', icon: Plus, color: 'neon' },
                  { value: 'reduction', label: 'Remove Stock', icon: Minus, color: 'red' },
                ].map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = selectedType === opt.value;
                  return (
                    <label
                      key={opt.value}
                      className={cn(
                        'flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all',
                        isSelected && opt.color === 'neon'
                          ? 'border-neon bg-neon/10'
                          : isSelected && opt.color === 'red'
                          ? 'border-red-400 bg-red-50'
                          : 'border-border hover:border-grayLight'
                      )}
                    >
                      <input type="radio" value={opt.value} {...register('type')} className="hidden" />
                      <div className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center',
                        isSelected && opt.color === 'neon' ? 'bg-neon' : 'bg-bg'
                      )}>
                        <Icon size={16} className={isSelected && opt.color === 'neon' ? 'text-navyDeep' : 'text-grayMid'} />
                      </div>
                      <span className={cn('text-sm font-medium', isSelected ? 'text-navy' : 'text-grayMid')}>
                        {opt.label}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-navy mb-1.5">
                Quantity <span className="text-red-500">*</span>
              </label>
              <input
                {...register('quantity')}
                type="number"
                min="1"
                placeholder="e.g. 50"
                className={cn('input-base', errors.quantity && 'border-red-400')}
              />
              {errors.quantity && <p className="text-red-500 text-xs mt-1">{errors.quantity.message}</p>}
            </div>

            {/* Reference Type */}
            <div>
              <label className="block text-sm font-medium text-navy mb-1.5">
                Reference Type <span className="text-red-500">*</span>
              </label>
              <select {...register('referenceType')} className="input-base">
                {REFERENCE_TYPES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-navy mb-1.5">
                Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                {...register('reason')}
                rows={3}
                placeholder="Explain why you're adjusting this stock..."
                className={cn('input-base resize-none', errors.reason && 'border-red-400')}
              />
              {errors.reason && <p className="text-red-500 text-xs mt-1">{errors.reason.message}</p>}
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full justify-center py-3">
              {isSubmitting ? 'Adjusting...' : 'Apply Adjustment'}
            </button>
          </form>

          {/* Result Banner */}
          {adjustResult && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-neon/10 border border-neon/30 rounded-xl p-4"
            >
              <p className="text-navy font-semibold text-sm">✓ Adjustment Applied</p>
              <p className="text-grayMid text-xs mt-1">
                New stock level: <strong className="text-navy">{adjustResult.newStock ?? adjustResult.currentStock ?? '—'}</strong>
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
