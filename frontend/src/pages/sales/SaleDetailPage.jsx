import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { ArrowLeft, Printer } from 'lucide-react';
import { fetchSaleById, selectSaleSelected, selectSalesLoading } from '../../store/slices/salesSlice';
import Badge from '../../components/ui/Badge';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import { formatCurrency, formatDate } from '../../utils/formatters';

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function SaleDetailPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const sale = useSelector(selectSaleSelected);
  const loading = useSelector(selectSalesLoading);

  useEffect(() => {
    dispatch(fetchSaleById(id));
  }, [dispatch, id]);

  if (loading) return <SkeletonLoader rows={5} cols={4} />;
  if (!sale) return <div className="text-center py-16 text-gray">Sale not found.</div>;

  const items = sale.items || sale.saleItems || [];

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/sales')} className="btn-secondary px-3 py-2">
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1">
          <h1 className="font-display font-bold text-xl text-navy">
            Invoice #{String(sale.id).slice(-8).toUpperCase()}
          </h1>
          <p className="text-gray text-xs">{formatDate(sale.createdAt)}</p>
        </div>
        <button className="btn-secondary" title="Print (coming soon)">
          <Printer size={15} /> Print
        </button>
      </div>

      {/* Invoice Card */}
      <div className="card space-y-5">
        {/* Header Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-grayMid mb-1">Customer</p>
            <p className="font-semibold text-navy">{sale.customerName || 'Walk-in'}</p>
          </div>
          <div>
            <p className="text-xs text-grayMid mb-1">Payment Method</p>
            <Badge variant={sale.paymentMethod?.toLowerCase() || 'other'}>
              {sale.paymentMethod || 'Other'}
            </Badge>
          </div>
          <div>
            <p className="text-xs text-grayMid mb-1">Sold By</p>
            <p className="text-navy text-sm">{sale.user?.name || sale.createdBy || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-grayMid mb-1">Date</p>
            <p className="text-navy text-sm">{formatDate(sale.createdAt)}</p>
          </div>
        </div>

        {/* Items Table */}
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
                    <td className="px-4 py-3">{formatCurrency(item.sellingPrice || item.unitPrice || 0)}</td>
                    <td className="px-4 py-3 font-semibold">{formatCurrency(item.subtotal || (item.sellingPrice || item.unitPrice || 0) * (item.quantity || 1))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Total */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <span className="font-display font-semibold text-lg text-navy">Total Amount</span>
          <span className="font-display font-bold text-3xl text-neon">{formatCurrency(sale.totalAmount || 0)}</span>
        </div>
      </div>
    </motion.div>
  );
}
