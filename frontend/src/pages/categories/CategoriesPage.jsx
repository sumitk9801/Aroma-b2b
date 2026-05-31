import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, Grid3X3 } from 'lucide-react';
import {
  fetchCategories, createCategory, updateCategory, deleteCategory,
  setSelected, clearSelected,
  selectCategories, selectCategoriesLoading, selectCategorySelected,
} from '../../store/slices/categoriesSlice';
import { fetchShops, selectShops } from '../../store/slices/shopsSlice';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import PageHeader from '../../components/ui/PageHeader';
import Drawer from '../../components/ui/Drawer';
import Modal from '../../components/ui/Modal';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import Badge from '../../components/ui/Badge';
import { toast } from 'sonner';
import { cn } from '../../utils/cn';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  shopId: z.string().min(1, 'Shop is required'),
  imageUrl: z.string().optional(),
});

const pageVariants = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0, transition: { duration: 0.3 } } };
const cardVariants = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } };

const CATEGORY_COLORS = ['bg-neon/20', 'bg-lime/20', 'bg-blue-100', 'bg-purple-100', 'bg-amber-100', 'bg-pink-100'];

export default function CategoriesPage() {
  const dispatch = useDispatch();
  const categories = useSelector(selectCategories);
  const loading = useSelector(selectCategoriesLoading);
  const selected = useSelector(selectCategorySelected);
  const shops = useSelector(selectShops);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ open: false, category: null });
  const [deleting, setDeleting] = useState(false);

  const isEditing = Boolean(selected);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(fetchShops());
  }, [dispatch]);

  useEffect(() => {
    if (selected) {
      reset({ name: selected.name || '', shopId: selected.shopId || '', imageUrl: selected.imageUrl || '' });
    } else {
      reset({ name: '', shopId: '', imageUrl: '' });
    }
  }, [selected, reset]);

  const openCreate = () => { dispatch(clearSelected()); setDrawerOpen(true); };
  const openEdit = (cat) => { dispatch(setSelected(cat)); setDrawerOpen(true); };
  const closeDrawer = () => { setDrawerOpen(false); dispatch(clearSelected()); };

  const onSubmit = async (data) => {
    let result;
    if (isEditing) {
      result = await dispatch(updateCategory({ id: selected.id, data }));
      if (updateCategory.fulfilled.match(result)) { toast.success('Category updated!'); closeDrawer(); }
      else toast.error(result.payload || 'Failed to update');
    } else {
      result = await dispatch(createCategory(data));
      if (createCategory.fulfilled.match(result)) { toast.success('Category created!'); closeDrawer(); }
      else toast.error(result.payload || 'Failed to create');
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    const result = await dispatch(deleteCategory(deleteModal.category.id));
    setDeleting(false);
    if (deleteCategory.fulfilled.match(result)) {
      toast.success('Category deleted');
      setDeleteModal({ open: false, category: null });
    } else {
      toast.error('Failed to delete');
    }
  };

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" className="space-y-5">
      <PageHeader
        title="Categories"
        subtitle={`${categories.length} categories`}
        action={<button onClick={openCreate} className="btn-primary"><Plus size={16} /> Add Category</button>}
      />

      {loading ? (
        <SkeletonLoader cardCount={8} cardHeight="h-36" />
      ) : (
        <motion.div
          initial="initial" animate="animate"
          transition={{ staggerChildren: 0.06 }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
        >
          {categories.map((cat, i) => {
            const shop = shops.find((s) => s.id === cat.shopId);
            return (
              <motion.div
                key={cat.id}
                variants={cardVariants}
                whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(27,25,70,0.12)' }}
                className="card group relative"
              >
                <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center mb-3', CATEGORY_COLORS[i % CATEGORY_COLORS.length])}>
                  {cat.imageUrl
                    ? <img src={cat.imageUrl} alt={cat.name} className="w-full h-full object-cover rounded-2xl" />
                    : <Grid3X3 size={20} className="text-navy/50" />
                  }
                </div>
                <p className="font-display font-semibold text-navy text-sm mb-1">{cat.name}</p>
                {shop && <Badge variant="info">{shop.name}</Badge>}
                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(cat)} className="p-1.5 bg-white rounded-lg border border-border shadow-card hover:bg-bg">
                    <Pencil size={12} className="text-grayMid" />
                  </button>
                  <button onClick={() => setDeleteModal({ open: true, category: cat })} className="p-1.5 bg-white rounded-lg border border-border shadow-card hover:bg-red-50">
                    <Trash2 size={12} className="text-red-500" />
                  </button>
                </div>
              </motion.div>
            );
          })}

          {/* Add new card */}
          <motion.button
            variants={cardVariants}
            onClick={openCreate}
            className="border-2 border-dashed border-border rounded-2xl p-5 flex flex-col items-center justify-center gap-2 hover:border-neon hover:bg-neon/5 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-bg border border-border flex items-center justify-center group-hover:bg-neon/20 transition-colors">
              <Plus size={18} className="text-grayMid group-hover:text-navyDeep" />
            </div>
            <span className="text-sm text-grayMid font-medium group-hover:text-navy">Add Category</span>
          </motion.button>
        </motion.div>
      )}

      {/* Form Drawer */}
      <Drawer
        isOpen={drawerOpen}
        onClose={closeDrawer}
        title={isEditing ? 'Edit Category' : 'New Category'}
        footer={
          <div className="flex gap-3">
            <button type="button" onClick={closeDrawer} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" form="category-form" disabled={isSubmitting} className="btn-primary flex-1 justify-center">
              {isSubmitting ? 'Saving...' : isEditing ? 'Update' : 'Create'}
            </button>
          </div>
        }
      >
        <form id="category-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-navy mb-1.5">Name <span className="text-red-500">*</span></label>
            <input {...register('name')} className={cn('input-base', errors.name && 'border-red-400')} placeholder="Category name" />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1.5">Shop <span className="text-red-500">*</span></label>
            <select {...register('shopId')} className={cn('input-base', errors.shopId && 'border-red-400')}>
              <option value="">Select shop</option>
              {shops.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            {errors.shopId && <p className="text-red-500 text-xs mt-1">{errors.shopId.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1.5">Image URL (optional)</label>
            <input {...register('imageUrl')} type="url" className="input-base" placeholder="https://..." />
          </div>
        </form>
      </Drawer>

      {/* Delete Modal */}
      <Modal isOpen={deleteModal.open} onClose={() => setDeleteModal({ open: false, category: null })} title="Delete Category" size="sm">
        <p className="text-gray text-sm mb-5">Delete <strong className="text-navy">{deleteModal.category?.name}</strong>? This action cannot be undone.</p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteModal({ open: false, category: null })} className="btn-secondary flex-1 justify-center">Cancel</button>
          <button onClick={handleDelete} disabled={deleting} className="btn-danger flex-1 justify-center">
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </Modal>
    </motion.div>
  );
}
