import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { Plus, Pencil, Store } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { fetchShops, createShop, updateShop, setSelected, clearSelected, selectShops, selectShopsLoading, selectShopSelected } from '../../store/slices/shopsSlice';
import DataTable from '../../components/ui/DataTable';
import PageHeader from '../../components/ui/PageHeader';
import Drawer from '../../components/ui/Drawer';
import { formatDateOnly } from '../../utils/formatters';
import { toast } from 'sonner';
import { cn } from '../../utils/cn';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  businessType: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
});

const pageVariants = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

export default function ShopsPage() {
  const dispatch = useDispatch();
  const shops = useSelector(selectShops);
  const loading = useSelector(selectShopsLoading);
  const selected = useSelector(selectShopSelected);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isEditing = Boolean(selected);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) });

  useEffect(() => { dispatch(fetchShops()); }, [dispatch]);

  useEffect(() => {
    if (selected) reset({ name: selected.name || '', businessType: selected.businessType || '', address: selected.address || '', phone: selected.phone || '' });
    else reset({ name: '', businessType: '', address: '', phone: '' });
  }, [selected, reset]);

  const openCreate = () => { dispatch(clearSelected()); setDrawerOpen(true); };
  const openEdit = (shop) => { dispatch(setSelected(shop)); setDrawerOpen(true); };
  const closeDrawer = () => { setDrawerOpen(false); dispatch(clearSelected()); };

  const onSubmit = async (data) => {
    let result;
    if (isEditing) {
      result = await dispatch(updateShop({ id: selected.id, data }));
      if (updateShop.fulfilled.match(result)) { toast.success('Shop updated!'); closeDrawer(); }
      else toast.error(result.payload || 'Failed');
    } else {
      result = await dispatch(createShop(data));
      if (createShop.fulfilled.match(result)) { toast.success('Shop created!'); closeDrawer(); }
      else toast.error(result.payload || 'Failed');
    }
  };

  const columns = [
    {
      key: 'shopCode', label: 'Shop ID', sortable: true,
      render: (v) => <span className="font-mono font-bold text-navy bg-navy/5 px-2 py-1 rounded text-xs">#{v}</span>
    },
    {
      key: 'name', label: 'Shop Name', sortable: true,
      render: (v) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-navy rounded-lg flex items-center justify-center">
            <Store size={14} className="text-neon" />
          </div>
          <span className="font-semibold text-navy">{v}</span>
        </div>
      ),
    },
    { key: 'businessType', label: 'Business Type', render: (v) => <span className="text-grayMid">{v || '—'}</span> },
    { key: 'address', label: 'Address', render: (v) => <span className="text-grayMid text-xs">{v || '—'}</span> },
    { key: 'phone', label: 'Phone', render: (v) => <span className="text-grayMid">{v || '—'}</span> },
    {
      key: 'createdAt', label: 'Created', sortable: true,
      render: (v) => <span className="text-grayMid text-xs">{formatDateOnly(v)}</span>,
    },
    {
      key: 'actions', label: '',
      render: (_, row) => (
        <button onClick={() => openEdit(row)} className="p-1.5 rounded-lg hover:bg-bg transition-colors text-grayMid hover:text-navy">
          <Pencil size={14} />
        </button>
      ),
    },
  ];

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" className="space-y-5">
      <PageHeader
        title="Shops"
        subtitle={`${shops.length} shops`}
        action={<button onClick={openCreate} className="btn-primary"><Plus size={16} /> Add Shop</button>}
      />
      <DataTable
        columns={columns}
        data={shops}
        loading={loading}
        emptyMessage="No shops found"
        emptyAction={<button onClick={openCreate} className="btn-primary">Add First Shop</button>}
      />

      <Drawer
        isOpen={drawerOpen}
        onClose={closeDrawer}
        title={isEditing ? 'Edit Shop' : 'New Shop'}
        footer={
          <div className="flex gap-3">
            <button type="button" onClick={closeDrawer} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" form="shop-form" disabled={isSubmitting} className="btn-primary flex-1 justify-center">
              {isSubmitting ? 'Saving...' : isEditing ? 'Update' : 'Create'}
            </button>
          </div>
        }
      >
        <form id="shop-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-navy mb-1.5">Shop Name <span className="text-red-500">*</span></label>
            <input {...register('name')} className={cn('input-base', errors.name && 'border-red-400')} placeholder="My Shop" />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1.5">Business Type</label>
            <input {...register('businessType')} className="input-base" placeholder="e.g. Retail, Wholesale" />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1.5">Address</label>
            <textarea {...register('address')} rows={2} className="input-base resize-none" placeholder="Shop address" />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1.5">Phone</label>
            <input {...register('phone')} type="tel" className="input-base" placeholder="+91 98765 43210" />
          </div>
        </form>
      </Drawer>
    </motion.div>
  );
}
