import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { fetchLowStockProducts, selectLowStockProducts, selectProductsLoading } from '../../store/slices/productsSlice';
import PageHeader from '../../components/ui/PageHeader';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import EmptyState from '../../components/ui/EmptyState';
import { CheckCircle } from 'lucide-react';

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const cardVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

export default function LowStockPage() {
  const dispatch = useDispatch();
  const products = useSelector(selectLowStockProducts);
  const loading = useSelector(selectProductsLoading);

  useEffect(() => {
    dispatch(fetchLowStockProducts());
  }, [dispatch]);

  if (loading) return <SkeletonLoader cardCount={6} />;

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" className="space-y-5">
      <PageHeader
        title="Low Stock Alerts"
        subtitle={products.length > 0 ? `${products.length} products need restocking` : 'All stock levels healthy'}
      />

      {products.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 bg-neon/15 rounded-2xl flex items-center justify-center mb-4">
            <CheckCircle size={28} className="text-navyDeep" />
          </div>
          <h3 className="font-display font-bold text-xl text-navy mb-2">All Stock Levels Healthy</h3>
          <p className="text-gray text-sm">No products are below their minimum stock threshold.</p>
        </div>
      ) : (
        <motion.div
          initial="initial"
          animate="animate"
          transition={{ staggerChildren: 0.06 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {products.map((product, i) => {
            const current = product.currentStock || 0;
            const minimum = product.minimumStock || 1;
            const percentage = Math.min(100, (current / minimum) * 100);
            const isZero = current === 0;

            return (
              <motion.div
                key={product.id}
                variants={cardVariants}
                whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(27,25,70,0.12)' }}
                className="card space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-semibold text-navy text-sm truncate">{product.name}</p>
                    <p className="text-grayMid text-xs">{product.skuCode || '—'}</p>
                  </div>
                  {isZero && (
                    <span className="flex-shrink-0 bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full ml-2">
                      OUT
                    </span>
                  )}
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-grayMid">Current stock</span>
                    <span className={`font-bold ${isZero ? 'text-red-600' : 'text-amber-600'}`}>
                      {current} / {minimum} min
                    </span>
                  </div>
                  <div className="h-2 bg-bg rounded-full overflow-hidden border border-border">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut', delay: i * 0.05 }}
                      className="h-full rounded-full"
                      style={{
                        background: isZero
                          ? '#ef4444'
                          : percentage < 50
                          ? '#f59e0b'
                          : '#B8ED23',
                      }}
                    />
                  </div>
                </div>

                {product.shop?.name && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-grayMid">Shop:</span>
                    <span className="text-xs font-medium text-navy">{product.shop.name}</span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </motion.div>
  );
}
