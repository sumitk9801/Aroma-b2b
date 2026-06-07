import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, Users, Store, AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  fetchUsers, createUser, updateUser, deleteUser,
  setSelected, clearSelected,
  selectUsers, selectUsersLoading, selectUserSelected,
} from '../../store/slices/usersSlice';
import { selectActiveShopId, selectActiveShopName, selectActiveShopRole } from '../../store/slices/uiSlice';
import { selectUser } from '../../store/slices/authSlice';
import DataTable from '../../components/ui/DataTable';
import PageHeader from '../../components/ui/PageHeader';
import Drawer from '../../components/ui/Drawer';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import { formatDateOnly } from '../../utils/formatters';
import { toast } from 'sonner';
import { cn } from '../../utils/cn';
import { useNavigate } from 'react-router-dom';

const STAFF_ROLES = [
  { value: 'staff',   label: 'Staff' },
  { value: 'manager', label: 'Manager' },
  { value: 'cashier', label: 'Cashier' },
  { value: 'admin',   label: 'Admin' },
];

const createSchema = z.object({
  name:     z.string().min(1, 'Name required'),
  email:    z.string().email('Valid email required'),
  password: z.string().min(6, 'Min 6 characters'),
  role:     z.enum(['staff', 'manager', 'cashier', 'admin']),
});

const editSchema = z.object({
  name:     z.string().min(1, 'Name required'),
  email:    z.string().email('Valid email required'),
  role:     z.enum(['staff', 'manager', 'cashier', 'admin']),
  isActive: z.boolean().default(true),
});

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function UsersPage() {
  const dispatch   = useDispatch();
  const navigate   = useNavigate();
  const users      = useSelector(selectUsers);
  const loading    = useSelector(selectUsersLoading);
  const selected   = useSelector(selectUserSelected);
  const activeShopId   = useSelector(selectActiveShopId);
  const activeShopName = useSelector(selectActiveShopName);
  const user = useSelector(selectUser);
  const activeShopRole = useSelector(selectActiveShopRole);

  const userRole = (activeShopRole || user?.role || 'staff').toUpperCase();
  const normalizedRole = userRole === 'STAFF' ? 'INVENTORY_STAFF' : userRole;
  const isManager = normalizedRole === 'MANAGER';

  const [drawerOpen,   setDrawerOpen]   = useState(false);
  const [deleteModal,  setDeleteModal]  = useState({ open: false, user: null });
  const [deleting,     setDeleting]     = useState(false);

  const isEditing = Boolean(selected);
  const schema    = isEditing ? editSchema : createSchema;

  const {
    register, handleSubmit, reset, setValue, watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { role: 'staff', isActive: true },
  });

  // Fetch users whenever active shop changes
  useEffect(() => {
    if (activeShopId) {
      dispatch(fetchUsers({ shopId: activeShopId }));
    }
  }, [dispatch, activeShopId]);

  useEffect(() => {
    if (selected) {
      reset({
        name:     selected.name     || '',
        email:    selected.email    || '',
        role:     selected.role     || 'staff',
        isActive: selected.isActive !== false,
      });
    } else {
      reset({ name: '', email: '', password: '', role: 'staff', isActive: true });
    }
  }, [selected, reset]);

  const openCreate = () => { dispatch(clearSelected()); setDrawerOpen(true); };
  const openEdit   = (user) => { dispatch(setSelected(user)); setDrawerOpen(true); };
  const closeDrawer = () => { setDrawerOpen(false); dispatch(clearSelected()); };

  const onSubmit = async (data) => {
    let result;
    if (isEditing) {
      const { password, ...payload } = data;
      result = await dispatch(updateUser({ id: selected.id, data: payload }));
      if (updateUser.fulfilled.match(result)) { toast.success('Staff member updated!'); closeDrawer(); }
      else toast.error(result.payload || 'Failed to update');
    } else {
      // Inject active shopId into the payload
      result = await dispatch(createUser({ ...data, shopId: activeShopId }));
      if (createUser.fulfilled.match(result)) {
        const createdUser = result.payload?.data || result.payload;
        const generatedId = createdUser?.staffId || '—';
        toast.success(
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-navy">Staff member added!</span>
            <span className="text-xs text-grayMid">Generated Staff ID: <strong className="font-mono text-neon bg-navy/10 px-1 py-0.5 rounded select-all">{generatedId}</strong></span>
          </div>,
          { duration: 6000 }
        );
        closeDrawer();
      }
      else toast.error(result.payload || 'Failed to create');
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    const result = await dispatch(deleteUser({ id: deleteModal.user.id, shopId: activeShopId }));
    setDeleting(false);
    if (deleteUser.fulfilled.match(result)) {
      toast.success('Staff member removed from shop');
      setDeleteModal({ open: false, user: null });
    } else toast.error('Failed to remove staff member');
  };

  const isActiveVal = watch('isActive');

  // ── Columns ─────────────────────────────────────────────────────────────────
  const columns = [
    {
      key: 'name', label: 'Name', sortable: true,
      render: (v, row) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-navy flex items-center justify-center flex-shrink-0">
            <span className="text-neon font-bold text-sm">{v?.charAt(0)?.toUpperCase()}</span>
          </div>
          <div>
            <p className="font-medium text-navy text-sm leading-tight">{v}</p>
            {row.isOwner && (
              <span className="text-[10px] font-semibold text-neon uppercase tracking-wide">Owner</span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'email', label: 'Email',
      render: (v) => <span className="text-grayMid text-sm">{v}</span>,
    },
    {
      key: 'staffId', label: 'Staff ID',
      render: (v) => <span className="font-mono text-xs font-semibold text-navy bg-navy/5 px-2 py-1 rounded select-all">{v || '—'}</span>,
    },
    {
      key: 'shopRole', label: 'Shop Role',
      render: (v, row) => {
        const roleLabel = v || row.role || 'staff';
        const colors = {
          admin:   'bg-purple-100 text-purple-700',
          manager: 'bg-blue-100 text-blue-700',
          cashier: 'bg-amber-100 text-amber-700',
          staff:   'bg-gray-100 text-gray-600',
        };
        return (
          <span className={cn(
            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize',
            colors[roleLabel] || colors.staff
          )}>
            {roleLabel}
          </span>
        );
      },
    },
    {
      key: 'isActive', label: 'Status',
      render: (v) => (
        <Badge variant={v !== false ? 'active' : 'inactive'}>
          {v !== false ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'createdAt', label: 'Joined', sortable: true,
      render: (v) => <span className="text-grayMid text-xs">{formatDateOnly(v)}</span>,
    },
    {
      key: 'actions', label: '',
      render: (_, row) => {
        const isTargetAdmin = row.shopRole?.toLowerCase() === 'admin' || row.role?.toLowerCase() === 'admin';
        const showEdit = !isManager || !isTargetAdmin;
        const showDelete = !row.isOwner && (!isManager || !isTargetAdmin);
        
        return (
          <div className="flex items-center gap-1">
            {showEdit && (
              <button
                onClick={() => openEdit(row)}
                className="p-1.5 rounded-lg hover:bg-bg text-grayMid hover:text-navy transition-colors"
                title="Edit staff member"
              >
                <Pencil size={14} />
              </button>
            )}
            {showDelete && (
              <button
                onClick={() => setDeleteModal({ open: true, user: row })}
                className="p-1.5 rounded-lg hover:bg-red-50 text-grayMid hover:text-red-600 transition-colors"
                title="Remove from shop"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  // ── No shop selected state ───────────────────────────────────────────────────
  if (!activeShopId) {
    return (
      <motion.div variants={pageVariants} initial="initial" animate="animate" className="space-y-5">
        <PageHeader title="Staff" subtitle="Manage your shop's team" />
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center">
            <AlertCircle size={28} className="text-amber-500" />
          </div>
          <div>
            <p className="text-navy font-semibold text-lg mb-1">No Shop Selected</p>
            <p className="text-grayMid text-sm max-w-xs">
              Please create a shop first, then come back to manage your staff.
            </p>
          </div>
          <button
            onClick={() => navigate('/shops')}
            className="btn-primary mt-2"
          >
            <Store size={16} /> Go to Shops
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" className="space-y-5">
      <PageHeader
        title="Staff"
        subtitle={
          <span className="flex items-center gap-1.5">
            <Store size={13} className="text-neon" />
            <span className="font-medium text-neon">{activeShopName}</span>
            <span className="text-grayMid">— {users.length} member{users.length !== 1 ? 's' : ''}</span>
          </span>
        }
        action={
          <button onClick={openCreate} className="btn-primary">
            <Plus size={16} /> Add Staff
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={users}
        loading={loading}
        emptyMessage="No staff members yet — add your first team member"
      />

      {/* ── Add / Edit Drawer ── */}
      <Drawer
        isOpen={drawerOpen}
        onClose={closeDrawer}
        title={isEditing ? 'Edit Staff Member' : 'Add Staff Member'}
        footer={
          <div className="flex gap-3">
            <button type="button" onClick={closeDrawer} className="btn-secondary flex-1 justify-center">
              Cancel
            </button>
            <button
              type="submit"
              form="user-form"
              disabled={isSubmitting}
              className="btn-primary flex-1 justify-center"
            >
              {isSubmitting ? 'Saving...' : isEditing ? 'Update' : 'Add to Shop'}
            </button>
          </div>
        }
      >
        {/* Shop context banner */}
        <div className="flex items-center gap-2 px-3 py-2.5 bg-neon/8 border border-neon/20 rounded-xl mb-5">
          <Store size={14} className="text-neon flex-shrink-0" />
          <p className="text-xs font-medium text-navy">
            {isEditing ? 'Editing member of' : 'Adding to'}{' '}
            <span className="text-neon font-semibold">{activeShopName}</span>
          </p>
        </div>

        <form id="user-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-navy mb-1.5">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              {...register('name')}
              className={cn('input-base', errors.name && 'border-red-400')}
              placeholder="e.g. Rahul Sharma"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-navy mb-1.5">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              {...register('email')}
              type="email"
              className={cn('input-base', errors.email && 'border-red-400')}
              placeholder="staff@example.com"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          {/* Password (create only) */}
          {!isEditing && (
            <div>
              <label className="block text-sm font-medium text-navy mb-1.5">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                {...register('password')}
                type="password"
                className={cn('input-base', errors.password && 'border-red-400')}
                placeholder="Min. 6 characters"
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>
          )}

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-navy mb-1.5">
              Role <span className="text-red-500">*</span>
            </label>
            <select {...register('role')} className="input-base">
              {STAFF_ROLES.filter(r => !isManager || r.value !== 'admin').map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
            <p className="text-xs text-grayMid mt-1">
              This is the staff member's role within <strong>{activeShopName}</strong>
            </p>
          </div>

          {/* Active Status (edit only) */}
          {isEditing && (
            <div className="flex items-center justify-between p-4 bg-bg rounded-xl border border-border">
              <div>
                <p className="text-sm font-medium text-navy">Active Status</p>
                <p className="text-xs text-grayMid">Inactive members cannot log in</p>
              </div>
              <button
                type="button"
                onClick={() => setValue('isActive', !isActiveVal)}
                className={cn(
                  'w-12 h-6 rounded-full transition-colors relative flex-shrink-0',
                  isActiveVal ? 'bg-neon' : 'bg-border'
                )}
              >
                <div className={cn(
                  'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
                  isActiveVal ? 'translate-x-6' : 'translate-x-0.5'
                )} />
              </button>
            </div>
          )}
        </form>
      </Drawer>

      {/* ── Delete Confirm Modal ── */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, user: null })}
        title="Remove Staff Member"
        size="sm"
      >
        <p className="text-gray text-sm mb-5">
          Remove <strong className="text-navy">{deleteModal.user?.name}</strong> from{' '}
          <strong className="text-navy">{activeShopName}</strong>? Their account won't be deleted,
          just removed from this shop.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setDeleteModal({ open: false, user: null })}
            className="btn-secondary flex-1 justify-center"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="btn-danger flex-1 justify-center"
          >
            {deleting ? 'Removing...' : 'Remove'}
          </button>
        </div>
      </Modal>
    </motion.div>
  );
}
