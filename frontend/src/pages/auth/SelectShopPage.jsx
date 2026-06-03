import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { Store, Building2, Shield, User, LogOut } from 'lucide-react';
import { selectShops, selectShopsLoading, fetchShops } from '../../store/slices/shopsSlice';
import { selectActiveShopId, setActiveShop } from '../../store/slices/uiSlice';
import { logoutUser, selectUser } from '../../store/slices/authSlice';
import { cn } from '../../utils/cn';
import { toast } from 'sonner';

export default function SelectShopPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const shops = useSelector(selectShops);
  const loading = useSelector(selectShopsLoading);
  const activeShopId = useSelector(selectActiveShopId);
  const user = useSelector(selectUser);

  useEffect(() => {
    dispatch(fetchShops());
  }, [dispatch]);

  const handleSelectShop = (shop) => {
    dispatch(setActiveShop({ id: shop.id, shopCode: shop.shopCode, name: shop.shopName || shop.name, role: shop.role }));
    toast.success(`Welcome to ${shop.shopName || shop.name}`);
    navigate('/dashboard');
  };

  const handleLogout = async () => {
    await dispatch(logoutUser());
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const getRoleBadgeClass = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'manager':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'cashier':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  return (
    <div className="min-h-screen bg-navyDeep flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Dynamic Background Gradients */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-neon/10 blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-blue-500/10 blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl z-10"
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8 text-center md:text-left">
          <div>
            <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
              <img src="/favicon.png" alt="Aroma B2B" className="w-8 h-8 object-contain scale-[2]" />
              <span className="font-display font-bold text-white text-xl">
                Aroma <span className="text-neon">B2B</span>
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-white leading-tight">
              Select Your Workspace
            </h1>
            <p className="text-grayLight text-sm mt-1">
              Select the shop context you want to log in to.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-white">{user?.name}</p>
              <p className="text-xs text-grayLight uppercase tracking-wider font-semibold text-neon">{user?.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 border border-white/10 rounded-xl text-sm text-red-400 bg-white/5 hover:bg-red-500/10 hover:border-red-500/20 transition-all"
              title="Sign Out"
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </div>
        </div>

        {/* Shop List / Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-48 rounded-2xl bg-white/5 border border-white/10 animate-pulse" />
            ))}
          </div>
        ) : shops.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-3xl p-12 text-center max-w-md mx-auto">
            <Store className="w-12 h-12 text-grayLight mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">No Shops Found</h3>
            <p className="text-grayLight text-sm mb-6">
              You are not assigned to any shop yet. Please contact your administrator.
            </p>
            <button
              onClick={handleLogout}
              className="btn-primary w-full justify-center"
            >
              Log Out
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {shops.map((shop, i) => (
              <motion.div
                key={shop.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.08 }}
                onClick={() => handleSelectShop(shop)}
                className={cn(
                  'group relative cursor-pointer border rounded-3xl p-6 bg-white/5 border-white/10 hover:bg-white/10 hover:border-neon/40 transition-all duration-300 backdrop-blur-md flex flex-col justify-between h-48',
                  activeShopId === shop.id && 'ring-2 ring-neon/40 border-neon/50'
                )}
              >
                {/* Shop Badge / Icon */}
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 rounded-2xl bg-neon/10 border border-neon/20 flex items-center justify-center text-neon group-hover:bg-neon group-hover:text-navyDeep transition-all duration-300">
                    <Building2 size={20} />
                  </div>
                  <div className="flex items-center gap-2">
                    {shop.shopCode && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-white border border-white/20">
                        ID: #{shop.shopCode}
                      </span>
                    )}
                    <span className={cn('px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border', getRoleBadgeClass(shop.role))}>
                      {shop.role || 'Staff'}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="mt-4 flex-1 min-w-0">
                  <h3 className="text-lg font-display font-semibold text-white group-hover:text-neon transition-colors truncate">
                    {shop.shopName || shop.name}
                  </h3>
                  <div className="flex items-center gap-4 text-xs text-grayLight mt-1">
                    <p className="truncate">{shop.businessType || 'Retail Store'}</p>
                    {shop.address && (
                      <>
                        <span className="w-1 h-1 bg-white/20 rounded-full" />
                        <p className="truncate">{shop.address}</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Footer Action */}
                <div className="mt-4 flex items-center justify-between text-xs text-grayLight border-t border-white/5 pt-3">
                  <span className="flex items-center gap-1">
                    <Shield size={12} className="text-neon" />
                    <span>Owner: {shop.owner?.name || 'Admin'}</span>
                  </span>
                  <span className="text-neon font-semibold group-hover:underline flex items-center gap-0.5">
                    Enter Shop &rarr;
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
