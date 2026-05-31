import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  fetchUsers, createUser, updateUser, deleteUser,
  setSelected, clearSelected,
  selectUsers, selectUsersLoading, selectUserSelected,
} from '../../store/slices/usersSlice';
import DataTable from '../../components/ui/DataTable';
import PageHeader from '../../components/ui/PageHeader';
import Drawer from '../../components/ui/Drawer';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import { formatDateOnly } from '../../utils/formatters';
import { USER_ROLES } from '../../utils/constants';
import { toast } from 'sonner';
import { cn } from '../../utils/cn';

const createSchema = z.object({
  name: z.string().min(1, 'Name required'),
  email: z.string().email(),
  password: z.string().min(6, 'Min 6 characters'),
  role: z.enum(['admin', 'customer']),
});

const editSchema = z.object({
  name: z.string().min(1, 'Name required'),
  email: z.string().email(),
  role: z.enum(['admin', 'customer']),
  isActive: z.boolean().default(true),
});

const pageVariants = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

export default function UsersPage() {
  const dispatch = useDispatch();
  const users = useSelector(selectUsers);
  const loading = useSelector(selectUsersLoading);
  const selected = useSelector(selectUserSelected);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ open: false, user: null });
  const [deleting, setDeleting] = useState(false);

  const isEditing = Boolean(selected);
  const schema = isEditing ? editSchema : createSchema;

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { role: 'customer', isActive: true },
  });

  useEffect(() => { dispatch(fetchUsers()); }, [dispatch]);

  useEffect(() => {
    if (selected) {
      reset({ name: selected.name || '', email: selected.email || '', role: selected.role || 'customer', isActive: selected.isActive !== false });
    } else {
      reset({ name: '', email: '', password: '', role: 'customer', isActive: true });
    }
  }, [selected, reset]);

  const openCreate = () => { dispatch(clearSelected()); setDrawerOpen(true); };
  const openEdit = (user) => { dispatch(setSelected(user)); setDrawerOpen(true); };
  const closeDrawer = () => { setDrawerOpen(false); dispatch(clearSelected()); };

  const onSubmit = async (data) => {
    let result;
    if (isEditing) {
      const { password, ...payload } = data;
      result = await dispatch(updateUser({ id: selected.id, data: payload }));
      if (updateUser.fulfilled.match(result)) { toast.success('User updated!'); closeDrawer(); }
      else toast.error(result.payload || 'Failed');
    } else {
      result = await dispatch(createUser(data));
      if (createUser.fulfilled.match(result)) { toast.success('User created!'); closeDrawer(); }
      else toast.error(result.payload || 'Failed');
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    const result = await dispatch(deleteUser(deleteModal.user.id));
    setDeleting(false);
    if (deleteUser.fulfilled.match(result)) { toast.success('User deleted'); setDeleteModal({ open: false, user: null }); }
    else toast.error('Failed to delete');
  };

  const isActiveVal = watch('isActive');

  const columns = [
    {
      key: 'name', label: 'Name', sortable: true,
      render: (v, row) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-navy flex items-center justify-center">
            <span className="text-neon font-semibold text-xs">{v?.charAt(0)?.toUpperCase()}</span>
          </div>
          <span className="font-medium text-navy">{v}</span>
        </div>
      ),
    },
    { key: 'email', label: 'Email', render: (v) => <span className="text-grayMid text-sm">{v}</span> },
    { key: 'role', label: 'Role', render: (v) => <Badge variant={v}>{v}</Badge> },
    {
      key: 'isActive', label: 'Status',
      render: (v) => <Badge variant={v !== false ? 'active' : 'inactive'}>{v !== false ? 'Active' : 'Inactive'}</Badge>,
    },
    { key: 'createdAt', label: 'Created', sortable: true, render: (v) => <span className="text-grayMid text-xs">{formatDateOnly(v)}</span> },
    {
      key: 'actions', label: '',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <button onClick={() => openEdit(row)} className="p-1.5 rounded-lg hover:bg-bg text-grayMid hover:text-navy transition-colors">
            <Pencil size={14} />
          </button>
          <button onClick={() => setDeleteModal({ open: true, user: row })} className="p-1.5 rounded-lg hover:bg-red-50 text-grayMid hover:text-red-600 transition-colors">
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" className="space-y-5">
      <PageHeader
        title="Users"
        subtitle={`${users.length} users`}
        action={<button onClick={openCreate} className="btn-primary"><Plus size={16} /> Add User</button>}
      />
      <DataTable columns={columns} data={users} loading={loading} emptyMessage="No users found" />

      <Drawer
        isOpen={drawerOpen}
        onClose={closeDrawer}
        title={isEditing ? 'Edit User' : 'Add New User'}
        footer={
          <div className="flex gap-3">
            <button type="button" onClick={closeDrawer} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" form="user-form" disabled={isSubmitting} className="btn-primary flex-1 justify-center">
              {isSubmitting ? 'Saving...' : isEditing ? 'Update' : 'Create'}
            </button>
          </div>
        }
      >
        <form id="user-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-navy mb-1.5">Name <span className="text-red-500">*</span></label>
            <input {...register('name')} className={cn('input-base', errors.name && 'border-red-400')} placeholder="Full name" />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1.5">Email <span className="text-red-500">*</span></label>
            <input {...register('email')} type="email" className={cn('input-base', errors.email && 'border-red-400')} placeholder="user@example.com" />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>
          {!isEditing && (
            <div>
              <label className="block text-sm font-medium text-navy mb-1.5">Password <span className="text-red-500">*</span></label>
              <input {...register('password')} type="password" className={cn('input-base', errors.password && 'border-red-400')} placeholder="Min. 6 characters" />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-navy mb-1.5">Role <span className="text-red-500">*</span></label>
            <select {...register('role')} className="input-base">
              {USER_ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          {isEditing && (
            <div className="flex items-center justify-between p-4 bg-bg rounded-xl border border-border">
              <div>
                <p className="text-sm font-medium text-navy">Active Status</p>
                <p className="text-xs text-grayMid">Inactive users cannot log in</p>
              </div>
              <button
                type="button"
                onClick={() => setValue('isActive', !isActiveVal)}
                className={cn('w-12 h-6 rounded-full transition-colors relative', isActiveVal ? 'bg-neon' : 'bg-border')}
              >
                <div className={cn('absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform', isActiveVal ? 'translate-x-6' : 'translate-x-0.5')} />
              </button>
            </div>
          )}
        </form>
      </Drawer>

      <Modal isOpen={deleteModal.open} onClose={() => setDeleteModal({ open: false, user: null })} title="Delete User" size="sm">
        <p className="text-gray text-sm mb-5">Delete user <strong className="text-navy">{deleteModal.user?.name}</strong>? This cannot be undone.</p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteModal({ open: false, user: null })} className="btn-secondary flex-1 justify-center">Cancel</button>
          <button onClick={handleDelete} disabled={deleting} className="btn-danger flex-1 justify-center">
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </Modal>
    </motion.div>
  );
}
