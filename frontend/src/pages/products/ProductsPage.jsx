import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Search, Filter, ClipboardList } from 'lucide-react';
import {
  fetchProducts, deleteProduct, setFilter, setSelected, clearSelected,
  selectProducts, selectProductsLoading, selectProductFilters,
} from '../../store/slices/productsSlice';
import { fetchCategories, selectCategories } from '../../store/slices/categoriesSlice';
import { selectActiveShopRole } from '../../store/slices/uiSlice';
import { fetchPendingCount, selectPendingRequestsCount } from '../../store/slices/productRequestsSlice';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import ProductFormDrawer from './ProductFormDrawer';
import { formatCurrency } from '../../utils/formatters';
import { cn } from '../../utils/cn';
import { toast } from 'sonner';
import { Pencil, Trash2, ImageIcon } from 'lucide-react';

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

export default function ProductsPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const products = useSelector(selectProducts);
  const loading = useSelector(selectProductsLoading);
  const filters = useSelector(selectProductFilters);
  const categories = useSelector(selectCategories);
  const activeShopRole = useSelector(selectActiveShopRole);
  const user = useSelector((s) => s.auth.user);
  const pendingCount = useSelector(selectPendingRequestsCount);

  // Prefer shop-context role, fall back to the user's global role
  const rawRole = (activeShopRole || user?.role || 'staff').toUpperCase();
  const normalizedRole = rawRole === 'STAFF' ? 'INVENTORY_STAFF' : rawRole;
  const isInventoryStaff = normalizedRole === 'INVENTORY_STAFF';
  const isManagerOrAdmin = normalizedRole === 'ADMIN' || normalizedRole === 'MANAGER';

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ open: false, product: null });
  const [searchValue, setSearchValue] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchCategories());
    if (isManagerOrAdmin) dispatch(fetchPendingCount());
  }, [dispatch, isManagerOrAdmin]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(setFilter({ search: searchValue }));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchValue, dispatch]);

  // Client-side filtering
  const filteredProducts = useMemo(() => {
    let result = [...products];
    const search = filters.search?.toLowerCase();
    if (search) {
      result = result.filter(
        (p) =>
          p.name?.toLowerCase().includes(search) ||
          p.skuCode?.toLowerCase().includes(search)
      );
    }
    if (filters.categoryId) {
      result = result.filter((p) => p.categoryId === filters.categoryId);
    }
    if (filters.isActive !== null && filters.isActive !== undefined && filters.isActive !== '') {
      const active = filters.isActive === 'true' || filters.isActive === true;
      result = result.filter((p) => p.isActive === active);
    }
    if (filters.lowStock) {
      result = result.filter((p) => (p.currentStock || 0) <= (p.minimumStock || 0));
    }
    return result;
  }, [products, filters]);

  const openCreate = () => {
    dispatch(clearSelected());
    setDrawerOpen(true);
  };

  const openEdit = (product) => {
    dispatch(setSelected(product));
    setDrawerOpen(true);
  };

  const handleDelete = async () => {
    setDeleting(true);
    const result = await dispatch(deleteProduct(deleteModal.product.id));
    setDeleting(false);
    if (deleteProduct.fulfilled.match(result)) {
      toast.success('Product deleted');
      setDeleteModal({ open: false, product: null });
    } else {
      toast.error('Failed to delete product');
    }
  };

  const stockColor = (product) => {
    const stock = product.currentStock || 0;
    const min = product.minimumStock || 0;
    if (stock <= min) return 'text-red-600 font-bold';
    if (stock <= min * 2) return 'text-amber-600 font-semibold';
    return 'text-navyDeep';
  };

  const columns = [
    {
      key: 'image',
      label: '',
      render: (_, row) => (
        <div className="w-9 h-9 rounded-xl overflow-hidden bg-bg border border-border flex items-center justify-center">
          {row.imageUrl
            ? <img src={row.imageUrl} alt={row.name} className="w-full h-full object-cover" />
            : <ImageIcon size={14} className="text-grayMid" />
          }
        </div>
      ),
    },
    {
      key: 'name', label: 'Product', sortable: true,
      render: (_, row) => (
        <div>
          <p className="font-medium text-navy text-sm">{row.name}</p>
          <p className="text-grayMid text-xs">{row.skuCode || '—'}</p>
        </div>
      ),
    },
    {
      key: 'categoryId', label: 'Category',
      render: (_, row) => {
        const cat = categories.find((c) => c.id === row.categoryId);
        return cat ? <Badge variant="info">{cat.name}</Badge> : <span className="text-grayMid text-xs">—</span>;
      },
    },
    {
      key: 'purchasePrice', label: 'Purchase', sortable: true,
      render: (v) => <span className="text-grayMid">{formatCurrency(v || 0)}</span>,
    },
    {
      key: 'sellingPrice', label: 'Selling', sortable: true,
      render: (v) => <span className="font-semibold text-navy">{formatCurrency(v || 0)}</span>,
    },
    {
      key: 'currentStock', label: 'Stock', sortable: true,
      render: (_, row) => (
        <span className={stockColor(row)}>
          {row.currentStock ?? 0}
        </span>
      ),
    },
    {
      key: 'isActive', label: 'Status',
      render: (v) => <Badge variant={v ? 'active' : 'inactive'}>{v ? 'Active' : 'Inactive'}</Badge>,
    },
    {
      key: 'actions', label: '',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => openEdit(row)}
            className="p-1.5 rounded-lg hover:bg-bg transition-colors text-grayMid hover:text-navy"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => setDeleteModal({ open: true, product: row })}
            className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-grayMid hover:text-red-600"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" className="space-y-5">
      <PageHeader
        title="Products"
        subtitle={`${filteredProducts.length} products`}
        action={
          isInventoryStaff ? (
            <button onClick={() => navigate('/products/requests/new')} className="btn-primary">
              <ClipboardList size={16} /> Request Product
            </button>
          ) : (
            <div className="flex items-center gap-2">
              {isManagerOrAdmin && pendingCount > 0 && (
                <button
                  onClick={() => navigate('/products/requests')}
                  className="relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
                >
                  <ClipboardList size={15} />
                  Requests
                  <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center font-bold">
                    {pendingCount}
                  </span>
                </button>
              )}
              <button onClick={openCreate} className="btn-primary">
                <Plus size={16} /> Add Product
              </button>
            </div>
          )
        }
      />

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-grayMid" />
          <input
            type="text"
            placeholder="Search by name or SKU..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="input-base !pl-10 py-2"
          />
        </div>

        <select
          value={filters.categoryId || ''}
          onChange={(e) => dispatch(setFilter({ categoryId: e.target.value }))}
          className="input-base w-auto min-w-[150px]"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <select
          value={filters.isActive ?? ''}
          onChange={(e) => dispatch(setFilter({ isActive: e.target.value }))}
          className="input-base w-auto"
        >
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>

        <button
          onClick={() => dispatch(setFilter({ lowStock: !filters.lowStock }))}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors',
            filters.lowStock
              ? 'bg-red-50 text-red-600 border-red-200'
              : 'bg-white border-border text-grayMid hover:border-red-300'
          )}
        >
          <Filter size={14} />
          Low Stock
        </button>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredProducts}
        loading={loading}
        emptyMessage="No products found"
        emptyAction={<button onClick={openCreate} className="btn-primary">Add Product</button>}
      />

      {/* Product Form Drawer */}
      <ProductFormDrawer
        isOpen={drawerOpen}
        onClose={() => { setDrawerOpen(false); dispatch(clearSelected()); }}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, product: null })}
        title="Delete Product"
        size="sm"
      >
        <p className="text-gray text-sm mb-5">
          Are you sure you want to delete <strong className="text-navy">{deleteModal.product?.name}</strong>?
          This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setDeleteModal({ open: false, product: null })}
            className="btn-secondary flex-1 justify-center"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="btn-danger flex-1 justify-center"
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </Modal>
    </motion.div>
  );
}
