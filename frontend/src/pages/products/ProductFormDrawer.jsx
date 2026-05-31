import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import Drawer from '../../components/ui/Drawer';
import ImageUpload from '../../components/ui/ImageUpload';
import { createProduct, updateProduct, selectSelectedProduct } from '../../store/slices/productsSlice';
import { selectCategories } from '../../store/slices/categoriesSlice';
import { selectShops } from '../../store/slices/shopsSlice';
import { fetchShops } from '../../store/slices/shopsSlice';
import { uploadsApi } from '../../api/uploads.api';
import { cn } from '../../utils/cn';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  skuCode: z.string().optional(),
  categoryId: z.string().min(1, 'Category is required'),
  shopId: z.string().min(1, 'Shop is required'),
  purchasePrice: z.coerce.number().nonnegative('Must be 0 or more'),
  sellingPrice: z.coerce.number().nonnegative('Must be 0 or more'),
  currentStock: z.coerce.number().int().nonnegative('Must be 0 or more'),
  minimumStock: z.coerce.number().int().nonnegative('Must be 0 or more'),
  isActive: z.boolean().default(true),
});

const FormField = ({ label, error, required, children }) => (
  <div>
    <label className="block text-sm font-medium text-navy mb-1.5">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
);

export default function ProductFormDrawer({ isOpen, onClose }) {
  const dispatch = useDispatch();
  const selected = useSelector(selectSelectedProduct);
  const categories = useSelector(selectCategories);
  const shops = useSelector(selectShops);
  const [imageFile, setImageFile] = React.useState(null);
  const [submitting, setSubmitting] = React.useState(false);

  const isEditing = Boolean(selected);

  const { register, handleSubmit, reset, formState: { errors }, watch, setValue } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { isActive: true, currentStock: 0, minimumStock: 0, purchasePrice: 0, sellingPrice: 0 },
  });

  useEffect(() => {
    dispatch(fetchShops());
  }, [dispatch]);

  useEffect(() => {
    if (selected) {
      reset({
        name: selected.name || '',
        description: selected.description || '',
        skuCode: selected.skuCode || '',
        categoryId: selected.categoryId || '',
        shopId: selected.shopId || '',
        purchasePrice: selected.purchasePrice || 0,
        sellingPrice: selected.sellingPrice || 0,
        currentStock: selected.currentStock || 0,
        minimumStock: selected.minimumStock || 0,
        isActive: selected.isActive !== undefined ? selected.isActive : true,
      });
      setImageFile(selected.imageUrl || null);
    } else {
      reset({ isActive: true, currentStock: 0, minimumStock: 0, purchasePrice: 0, sellingPrice: 0 });
      setImageFile(null);
    }
  }, [selected, reset]);

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      let imageUrl = typeof imageFile === 'string' ? imageFile : null;

      // Upload new image if it's a File
      if (imageFile instanceof File) {
        const formData = new FormData();
        formData.append('image', imageFile);
        try {
          const res = await uploadsApi.uploadProductImage(formData);
          imageUrl = res.data?.data?.url || res.data?.url || null;
        } catch {
          toast.error('Image upload failed, continuing without image.');
        }
      }

      const payload = { ...data, ...(imageUrl && { imageUrl }) };

      let result;
      if (isEditing) {
        result = await dispatch(updateProduct({ id: selected.id, data: payload }));
        if (updateProduct.fulfilled.match(result)) {
          toast.success('Product updated!');
          onClose();
        } else {
          toast.error(result.payload || 'Failed to update product');
        }
      } else {
        result = await dispatch(createProduct(payload));
        if (createProduct.fulfilled.match(result)) {
          toast.success('Product created!');
          onClose();
        } else {
          toast.error(result.payload || 'Failed to create product');
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const isActiveValue = watch('isActive');

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Product' : 'Add New Product'}
      footer={
        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">
            Cancel
          </button>
          <button
            type="submit"
            form="product-form"
            disabled={submitting}
            className="btn-primary flex-1 justify-center"
          >
            {submitting ? 'Saving...' : isEditing ? 'Update Product' : 'Create Product'}
          </button>
        </div>
      }
    >
      <form id="product-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Image Upload */}
        <ImageUpload
          label="Product Image"
          value={imageFile}
          onChange={setImageFile}
        />

        <FormField label="Product Name" required error={errors.name?.message}>
          <input {...register('name')} className={cn('input-base', errors.name && 'border-red-400')} placeholder="e.g. Jasmine Essential Oil" />
        </FormField>

        <FormField label="Description" error={errors.description?.message}>
          <textarea {...register('description')} rows={3} className="input-base resize-none" placeholder="Optional product description" />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="SKU Code" error={errors.skuCode?.message}>
            <input {...register('skuCode')} className="input-base" placeholder="e.g. JEO-001" />
          </FormField>

          <FormField label="Category" required error={errors.categoryId?.message}>
            <select {...register('categoryId')} className={cn('input-base', errors.categoryId && 'border-red-400')}>
              <option value="">Select category</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </FormField>
        </div>

        <FormField label="Shop" required error={errors.shopId?.message}>
          <select {...register('shopId')} className={cn('input-base', errors.shopId && 'border-red-400')}>
            <option value="">Select shop</option>
            {shops.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Purchase Price (₹)" required error={errors.purchasePrice?.message}>
            <input {...register('purchasePrice')} type="number" step="0.01" className={cn('input-base', errors.purchasePrice && 'border-red-400')} placeholder="0" />
          </FormField>
          <FormField label="Selling Price (₹)" required error={errors.sellingPrice?.message}>
            <input {...register('sellingPrice')} type="number" step="0.01" className={cn('input-base', errors.sellingPrice && 'border-red-400')} placeholder="0" />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Current Stock" required error={errors.currentStock?.message}>
            <input {...register('currentStock')} type="number" className="input-base" placeholder="0" />
          </FormField>
          <FormField label="Minimum Stock" required error={errors.minimumStock?.message}>
            <input {...register('minimumStock')} type="number" className="input-base" placeholder="0" />
          </FormField>
        </div>

        {/* Active Toggle */}
        <div className="flex items-center justify-between p-4 bg-bg rounded-xl border border-border">
          <div>
            <p className="text-sm font-medium text-navy">Active Status</p>
            <p className="text-xs text-grayMid">Inactive products won't appear in sales</p>
          </div>
          <button
            type="button"
            onClick={() => setValue('isActive', !isActiveValue)}
            className={cn(
              'w-12 h-6 rounded-full transition-colors relative',
              isActiveValue ? 'bg-neon' : 'bg-border'
            )}
          >
            <div className={cn(
              'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
              isActiveValue ? 'translate-x-6' : 'translate-x-0.5'
            )} />
          </button>
        </div>
      </form>
    </Drawer>
  );
}
