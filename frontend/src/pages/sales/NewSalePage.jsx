import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { ShoppingCart, Plus, Minus, Trash2, Search } from 'lucide-react';
import { fetchProducts, selectProducts } from '../../store/slices/productsSlice';
import { createSale } from '../../store/slices/salesSlice';
import { selectShops, fetchShops } from '../../store/slices/shopsSlice';
import { selectUser } from '../../store/slices/authSlice';
import { formatCurrency } from '../../utils/formatters';
import { PAYMENT_METHODS } from '../../utils/constants';
import { toast } from 'sonner';
import { cn } from '../../utils/cn';

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function NewSalePage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const products = useSelector(selectProducts);
  const shops = useSelector(selectShops);
  const user = useSelector(selectUser);

  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [shopId, setShopId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchShops());
  }, [dispatch]);

  useEffect(() => {
    if (shops.length === 1) setShopId(shops[0].id);
  }, [shops]);

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products.slice(0, 20);
    const q = searchQuery.toLowerCase();
    return products.filter((p) =>
      p.name?.toLowerCase().includes(q) || p.skuCode?.toLowerCase().includes(q)
    );
  }, [products, searchQuery]);

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, {
        productId: product.id,
        name: product.name,
        unitPrice: product.sellingPrice || 0,
        quantity: 1,
        maxStock: product.currentStock || 0,
      }];
    });
  };

  const updateQty = (productId, delta) => {
    setCart((prev) =>
      prev.map((i) => i.productId === productId
        ? { ...i, quantity: Math.max(1, Math.min(i.maxStock, i.quantity + delta)) }
        : i
      ).filter((i) => i.quantity > 0)
    );
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  };

  const updatePrice = (productId, price) => {
    setCart((prev) =>
      prev.map((i) => i.productId === productId ? { ...i, unitPrice: Number(price) || 0 } : i)
    );
  };

  const total = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  const handleSubmit = async () => {
    if (cart.length === 0) { toast.error('Add at least one product'); return; }
    if (!shopId) { toast.error('Select a shop'); return; }

    setSubmitting(true);
    const payload = {
      shopId,
      customerName: customerName || undefined,
      paymentMethod,
      items: cart.map(({ productId, quantity, unitPrice }) => ({ productId, quantity, unitPrice })),
    };

    const result = await dispatch(createSale(payload));
    setSubmitting(false);
    if (createSale.fulfilled.match(result)) {
      const saleId = result.payload?.sale?.id || result.payload?.id;
      toast.success('Sale recorded! ✓');
      if (saleId) navigate(`/sales/${saleId}`);
      else navigate('/sales');
    } else {
      toast.error(result.payload || 'Failed to record sale');
    }
  };

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate">
      <div className="mb-5">
        <h1 className="font-display font-bold text-2xl text-navy">New Sale</h1>
        <p className="text-gray text-sm">Add products to cart, then complete the sale.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Product Selector — Left */}
        <div className="lg:col-span-3 space-y-4">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-grayMid" />
            <input
              type="text"
              placeholder="Search products by name or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-base !pl-10"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[520px] overflow-y-auto scrollbar-thin pr-1">
            {filteredProducts.map((product) => {
              const inCart = cart.find((i) => i.productId === product.id);
              const outOfStock = (product.currentStock || 0) === 0;
              return (
                <motion.button
                  key={product.id}
                  whileHover={!outOfStock ? { y: -2 } : {}}
                  onClick={() => !outOfStock && addToCart(product)}
                  disabled={outOfStock}
                  className={cn(
                    'text-left p-3 rounded-2xl border transition-all',
                    outOfStock
                      ? 'bg-bg border-border opacity-50 cursor-not-allowed'
                      : inCart
                      ? 'border-neon bg-neon/10'
                      : 'bg-white border-border hover:border-navy/30 card-shadow'
                  )}
                >
                  <div className="w-full h-20 bg-bg rounded-xl mb-2 flex items-center justify-center border border-border overflow-hidden">
                    {product.imageUrl
                      ? <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                      : <ShoppingCart size={20} className="text-grayMid" />
                    }
                  </div>
                  <p className="text-xs font-semibold text-navy leading-tight line-clamp-2">{product.name}</p>
                  <p className="text-xs text-neon font-bold mt-1">{formatCurrency(product.sellingPrice || 0)}</p>
                  {outOfStock
                    ? <span className="text-[10px] text-red-500 font-medium">Out of Stock</span>
                    : <span className="text-[10px] text-grayMid">Stock: {product.currentStock}</span>
                  }
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Sale Summary — Right */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card space-y-4">
            <h3 className="font-display font-semibold text-navy">Sale Summary</h3>

            {/* Shop Select */}
            {shops.length > 1 && (
              <div>
                <label className="block text-xs font-medium text-grayMid mb-1">Shop</label>
                <select value={shopId} onChange={(e) => setShopId(e.target.value)} className="input-base text-sm">
                  <option value="">Select shop</option>
                  {shops.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            )}

            {/* Cart Items */}
            <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
              {cart.length === 0 ? (
                <div className="text-center py-8 text-gray text-sm">
                  <ShoppingCart size={24} className="mx-auto mb-2 text-grayMid" />
                  Click products to add them
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.productId} className="flex items-center gap-2 p-2 bg-bg rounded-xl border border-border">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-navy truncate">{item.name}</p>
                      <input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => updatePrice(item.productId, e.target.value)}
                        className="text-xs text-neon font-bold bg-transparent w-20 focus:outline-none"
                        step="0.01"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateQty(item.productId, -1)} className="w-6 h-6 rounded-lg bg-white border border-border flex items-center justify-center hover:bg-red-50 transition-colors">
                        <Minus size={10} />
                      </button>
                      <span className="w-6 text-center text-xs font-bold text-navy">{item.quantity}</span>
                      <button onClick={() => updateQty(item.productId, 1)} className="w-6 h-6 rounded-lg bg-white border border-border flex items-center justify-center hover:bg-neon/20 transition-colors">
                        <Plus size={10} />
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-navy">{formatCurrency(item.unitPrice * item.quantity)}</p>
                    </div>
                    <button onClick={() => removeFromCart(item.productId)} className="text-grayMid hover:text-red-600 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Customer Name */}
            <div>
              <label className="block text-xs font-medium text-grayMid mb-1">Customer Name (optional)</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Walk-in customer"
                className="input-base text-sm py-2"
              />
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-xs font-medium text-grayMid mb-1">Payment Method</label>
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_METHODS.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setPaymentMethod(m.value)}
                    className={cn(
                      'py-2 rounded-xl text-xs font-medium border transition-all',
                      paymentMethod === m.value
                        ? 'bg-navy text-white border-navy'
                        : 'bg-white border-border text-grayMid hover:border-navy/40'
                    )}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="border-t border-border pt-3 flex items-center justify-between">
              <span className="text-sm font-medium text-grayMid">Total</span>
              <span className="font-display font-bold text-2xl text-neon">{formatCurrency(total)}</span>
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting || cart.length === 0}
              className="btn-primary w-full justify-center py-3 text-base"
            >
              {submitting ? 'Processing...' : `Complete Sale — ${formatCurrency(total)}`}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
