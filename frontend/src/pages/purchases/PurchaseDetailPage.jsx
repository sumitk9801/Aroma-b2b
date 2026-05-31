import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { fetchPurchaseById, selectPurchaseSelected, selectPurchasesLoading } from '../../store/slices/purchasesSlice';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import { formatCurrency, formatDate } from '../../utils/formatters';

const pageVariants = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

export default function PurchaseDetailPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const purchase = useSelector(selectPurchaseSelected);
  const loading = useSelector(selectPurchasesLoading);

  useEffect(() => { dispatch(fetchPurchaseById(id)); }, [dispatch, id]);

  if (loading) return <SkeletonLoader rows={5} cols={4} />;
  if (!purchase) return <div className="text-center py-16 text-gray">Purchase not found.</div>;

  const items = purchase.items || purchase.purchaseItems || [];

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/purchases')} className="btn-secondary px-3 py-2">
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1">
          <h1 className="font-display font-bold text-xl text-navy">
            Purchase #{String(purchase.id).slice(-8).toUpperCase()}
          </h1>
          <p className="text-gray text-xs">{formatDate(purchase.createdAt)}</p>
        </div>
      </div>

      <div className="card space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-grayMid mb-1">Supplier</p>
            <p className="font-semibold text-navy">{purchase.supplierName || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-grayMid mb-1">Recorded By</p>
            <p className="text-navy text-sm">{purchase.user?.name || purchase.createdBy || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-grayMid mb-1">Shop</p>
            <p className="text-navy text-sm">{purchase.shop?.name || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-grayMid mb-1">Date</p>
            <p className="text-navy text-sm">{formatDate(purchase.createdAt)}</p>
          </div>
        </div>

        <div>
          <h3 className="font-display font-semibold text-navy mb-3">Items</h3>
          <div className="border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-bg border-b border-border">
                  {['Product', 'SKU', 'Qty', 'Unit Price', 'Subtotal'].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-grayMid uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((item, i) => (
                  <tr key={i} className="hover:bg-bg/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-navy">{item.product?.name || item.productName || '—'}</td>
                    <td className="px-4 py-3 text-grayMid text-xs">{item.product?.skuCode || '—'}</td>
                    <td className="px-4 py-3 font-semibold">{item.quantity}</td>
                    <td className="px-4 py-3">{formatCurrency(item.purchasePrice || 0)}</td>
                    <td className="px-4 py-3 font-semibold">{formatCurrency((item.purchasePrice || 0) * (item.quantity || 1))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border">
          <span className="font-display font-semibold text-lg text-navy">Total Amount</span>
          <span className="font-display font-bold text-3xl text-neon">{formatCurrency(purchase.totalAmount || 0)}</span>
        </div>
      </div>
    </motion.div>
  );
}
