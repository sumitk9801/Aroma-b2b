import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  ClipboardList, Plus, CheckCircle2, XCircle, Clock, Eye,
  Package, ChevronDown, ChevronUp, Barcode, Tag, Truck,
} from 'lucide-react';
import {
  fetchProductRequests, approveProductRequest, rejectProductRequest,
  selectProductRequests, selectProductRequestsLoading,
} from '../../store/slices/productRequestsSlice';
import { fetchCategories, selectCategories } from '../../store/slices/categoriesSlice';
import { selectActiveShopRole } from '../../store/slices/uiSlice';
import { selectUser } from '../../store/slices/authSlice';
import PageHeader from '../../components/ui/PageHeader';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { cn } from '../../utils/cn';

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const STATUS_CONFIG = {
  PENDING:  { label: 'Pending',  variant: 'warning', icon: Clock },
  APPROVED: { label: 'Approved', variant: 'active',  icon: CheckCircle2 },
  REJECTED: { label: 'Rejected', variant: 'inactive', icon: XCircle },
};

// ── Approve Modal ─────────────────────────────────────────────────────────────
function ApproveModal({ request, categories, onClose, onConfirm, loading }) {
  const [form, setForm] = useState({
    categoryId: '',
    skuCode: '',
    purchasePrice: request?.suggestedPrice || '',
    sellingPrice: request?.suggestedPrice || '',
    minimumStock: 5,
    currentStock: request?.quantity || 0,
    reviewNote: '',
  });

  const set = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.categoryId) { toast.error('Please select a category'); return; }
    if (!form.skuCode.trim()) { toast.error('SKU code is required'); return; }
    onConfirm({
      categoryId:    form.categoryId,
      skuCode:       form.skuCode.trim(),
      purchasePrice: parseFloat(form.purchasePrice) || 0,
      sellingPrice:  parseFloat(form.sellingPrice)  || 0,
      minimumStock:  parseFloat(form.minimumStock)  || 5,
      currentStock:  parseFloat(form.currentStock)  || 0,
      reviewNote:    form.reviewNote,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Request Summary */}
      <div className="p-4 rounded-xl bg-neon/5 border border-neon/20 space-y-2">
        <p className="text-sm font-bold text-navy">{request?.name}</p>
        {request?.description && <p className="text-xs text-grayMid">{request.description}</p>}
        <div className="flex flex-wrap gap-3 text-xs text-grayMid">
          {request?.barcodes && <span className="flex items-center gap-1"><Barcode size={11} /> {request.barcodes}</span>}
          {request?.suggestedPrice && <span className="flex items-center gap-1"><Tag size={11} /> Suggested: {formatCurrency(request.suggestedPrice)}</span>}
          {request?.supplierHint && <span className="flex items-center gap-1"><Truck size={11} /> {request.supplierHint}</span>}
          {request?.categoryHint && <span className="flex items-center gap-1"><Package size={11} /> Hint: {request.categoryHint}</span>}
        </div>
        <p className="text-xs text-grayMid">Requested by <strong className="text-navy">{request?.requester?.name}</strong></p>
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-navy mb-1.5">Category <span className="text-red-500">*</span></label>
        <select value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)} className="input-base" required>
          <option value="">— Select category —</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* SKU */}
      <div>
        <label className="block text-sm font-medium text-navy mb-1.5">SKU Code <span className="text-red-500">*</span></label>
        <input type="text" value={form.skuCode} onChange={(e) => set('skuCode', e.target.value)} placeholder="e.g. SKU-COCACOLA-500ML" className="input-base" required />
      </div>

      {/* Prices */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-navy mb-1.5">Purchase Price (₹)</label>
          <input type="number" min="0" step="0.01" value={form.purchasePrice} onChange={(e) => set('purchasePrice', e.target.value)} className="input-base" />
        </div>
        <div>
          <label className="block text-sm font-medium text-navy mb-1.5">Selling Price (₹)</label>
          <input type="number" min="0" step="0.01" value={form.sellingPrice} onChange={(e) => set('sellingPrice', e.target.value)} className="input-base" />
        </div>
      </div>

      {/* Stock */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-navy mb-1.5">Opening Stock</label>
          <input type="number" min="0" step="any" value={form.currentStock} onChange={(e) => set('currentStock', e.target.value)} className="input-base" />
        </div>
        <div>
          <label className="block text-sm font-medium text-navy mb-1.5">Min Stock Alert</label>
          <input type="number" min="0" step="any" value={form.minimumStock} onChange={(e) => set('minimumStock', e.target.value)} className="input-base" />
        </div>
      </div>

      {/* Review Note */}
      <div>
        <label className="block text-sm font-medium text-navy mb-1.5">Approval Note (optional)</label>
        <textarea rows={2} value={form.reviewNote} onChange={(e) => set('reviewNote', e.target.value)} placeholder="Any note for the staff member..." className="input-base resize-none" />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
        <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
          {loading ? 'Creating...' : <><CheckCircle2 size={15} /> Approve & Create Product</>}
        </button>
      </div>
    </form>
  );
}

// ── Reject Modal ──────────────────────────────────────────────────────────────
function RejectModal({ request, onClose, onConfirm, loading }) {
  const [reason, setReason] = useState('');
  return (
    <div className="space-y-4">
      <div className="p-4 rounded-xl bg-red-50 border border-red-200">
        <p className="text-sm font-bold text-navy">{request?.name}</p>
        <p className="text-xs text-grayMid mt-1">Requested by <strong>{request?.requester?.name}</strong></p>
      </div>
      <div>
        <label className="block text-sm font-medium text-navy mb-1.5">Rejection Reason <span className="text-red-500">*</span></label>
        <textarea
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Duplicate product exists (SKU-COKE-500). Please check existing catalog."
          className="input-base resize-none"
        />
      </div>
      <div className="flex gap-3">
        <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
        <button
          disabled={loading || !reason.trim()}
          onClick={() => onConfirm(reason.trim())}
          className="btn-danger flex-1 justify-center"
        >
          {loading ? 'Rejecting...' : <><XCircle size={15} /> Reject Request</>}
        </button>
      </div>
    </div>
  );
}

// ── Request Card ──────────────────────────────────────────────────────────────
function RequestCard({ request, isManagerOrAdmin, onApprove, onReject }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[request.status] || STATUS_CONFIG.PENDING;
  const Icon = cfg.icon;

  return (
    <motion.div
      layout
      className="card p-5 space-y-3"
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border',
          request.status === 'APPROVED' ? 'bg-green-50 border-green-200' :
          request.status === 'REJECTED' ? 'bg-red-50 border-red-200' :
          'bg-amber-50 border-amber-200'
        )}>
          <Icon size={16} className={
            request.status === 'APPROVED' ? 'text-green-600' :
            request.status === 'REJECTED' ? 'text-red-600' : 'text-amber-600'
          } />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-navy text-sm">{request.name}</h3>
            <Badge variant={cfg.variant}>{cfg.label}</Badge>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-grayMid">
            <span>By <strong className="text-navy">{request.requester?.name}</strong></span>
            <span>{formatDate(request.createdAt)}</span>
            {request.suggestedPrice && <span>Suggested: {formatCurrency(request.suggestedPrice)}</span>}
            {request.quantity && <span>Qty: {request.quantity}</span>}
          </div>
        </div>

        <button
          onClick={() => setExpanded((v) => !v)}
          className="p-1.5 rounded-lg hover:bg-bg text-grayMid transition-colors flex-shrink-0"
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-3 border-t border-border space-y-2">
              {request.description && (
                <p className="text-xs text-grayMid"><span className="font-medium text-navy">Description:</span> {request.description}</p>
              )}
              {request.barcodes && (
                <p className="text-xs text-grayMid flex items-center gap-1"><Barcode size={11} /> <span className="font-medium">Barcode:</span> {request.barcodes}</p>
              )}
              {request.categoryHint && (
                <p className="text-xs text-grayMid"><span className="font-medium">Category Hint:</span> {request.categoryHint}</p>
              )}
              {request.supplierHint && (
                <p className="text-xs text-grayMid"><span className="font-medium">Supplier:</span> {request.supplierHint}</p>
              )}
              {request.reviewNote && (
                <div className={cn(
                  'px-3 py-2 rounded-lg text-xs',
                  request.status === 'APPROVED' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                )}>
                  <span className="font-semibold">{request.status === 'APPROVED' ? '✓ Note:' : '✗ Reason:'}</span> {request.reviewNote}
                </div>
              )}
              {request.status === 'APPROVED' && request.product && (
                <div className="flex items-center gap-2 px-3 py-2 bg-neon/5 border border-neon/20 rounded-lg">
                  <Package size={13} className="text-neon" />
                  <span className="text-xs text-navy font-medium">Product created: <strong>{request.product.name}</strong> ({request.product.skuCode})</span>
                </div>
              )}
              {request.reviewer && (
                <p className="text-xs text-grayMid">Reviewed by <strong className="text-navy">{request.reviewer.name}</strong> · {formatDate(request.reviewedAt)}</p>
              )}
            </div>

            {/* Approve / Reject Buttons for Manager/Admin on PENDING */}
            {isManagerOrAdmin && request.status === 'PENDING' && (
              <div className="flex gap-2 mt-3">
                <button onClick={() => onApprove(request)} className="btn-primary flex-1 justify-center text-sm py-2">
                  <CheckCircle2 size={14} /> Approve
                </button>
                <button onClick={() => onReject(request)} className="btn-danger flex-1 justify-center text-sm py-2">
                  <XCircle size={14} /> Reject
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ProductRequestsPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const requests = useSelector(selectProductRequests);
  const loading = useSelector(selectProductRequestsLoading);
  const categories = useSelector(selectCategories);
  const activeShopRole = useSelector(selectActiveShopRole);
  const user = useSelector(selectUser);

  const rawRole = (activeShopRole || user?.role || 'staff').toUpperCase();
  const normalizedRole = rawRole === 'STAFF' ? 'INVENTORY_STAFF' : rawRole;
  const isInventoryStaff = normalizedRole === 'INVENTORY_STAFF';
  const isManagerOrAdmin = normalizedRole === 'ADMIN' || normalizedRole === 'MANAGER';

  const [statusFilter, setStatusFilter] = useState('');
  const [approveModal, setApproveModal] = useState({ open: false, request: null });
  const [rejectModal, setRejectModal] = useState({ open: false, request: null });
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchProductRequests(statusFilter ? { status: statusFilter } : {}));
    dispatch(fetchCategories());
  }, [dispatch, statusFilter]);

  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;

  const handleApprove = async (data) => {
    setActionLoading(true);
    const result = await dispatch(approveProductRequest({ id: approveModal.request.id, data }));
    setActionLoading(false);
    if (approveProductRequest.fulfilled.match(result)) {
      toast.success(`✓ Product "${approveModal.request.name}" created successfully!`);
      setApproveModal({ open: false, request: null });
      dispatch(fetchProductRequests());
    } else {
      toast.error(result.payload || 'Approval failed');
    }
  };

  const handleReject = async (reviewNote) => {
    setActionLoading(true);
    const result = await dispatch(rejectProductRequest({ id: rejectModal.request.id, reviewNote }));
    setActionLoading(false);
    if (rejectProductRequest.fulfilled.match(result)) {
      toast.success('Request rejected');
      setRejectModal({ open: false, request: null });
    } else {
      toast.error(result.payload || 'Rejection failed');
    }
  };

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" className="space-y-5">
      <PageHeader
        title="Product Requests"
        subtitle={
          isInventoryStaff
            ? `${requests.length} request${requests.length !== 1 ? 's' : ''} submitted`
            : `${pendingCount} pending review`
        }
        action={
          isInventoryStaff ? (
            <button onClick={() => navigate('/products/requests/new')} className="btn-primary">
              <Plus size={16} /> New Request
            </button>
          ) : null
        }
      />

      {/* Info banner */}
      <div className={cn(
        'flex items-start gap-3 px-5 py-4 rounded-2xl border text-sm',
        isInventoryStaff
          ? 'bg-blue-50 border-blue-200'
          : 'bg-amber-50 border-amber-200'
      )}>
        <ClipboardList size={17} className={isInventoryStaff ? 'text-blue-500 mt-0.5' : 'text-amber-500 mt-0.5'} />
        <div>
          {isInventoryStaff ? (
            <>
              <p className="font-semibold text-blue-800">Request New Products</p>
              <p className="text-xs text-blue-600 mt-0.5">Submit requests for new products. A Manager or Admin will review and add them to the catalog with pricing, SKU, and category details.</p>
            </>
          ) : (
            <>
              <p className="font-semibold text-amber-800">Review Product Requests</p>
              <p className="text-xs text-amber-600 mt-0.5">When you approve a request, the product is automatically created in your catalog. You set the final SKU, category, and pricing.</p>
            </>
          )}
        </div>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 flex-wrap">
        {[
          { label: 'All', value: '' },
          { label: 'Pending', value: 'PENDING' },
          { label: 'Approved', value: 'APPROVED' },
          { label: 'Rejected', value: 'REJECTED' },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-medium border transition-colors',
              statusFilter === f.value
                ? 'bg-navy text-white border-navy'
                : 'bg-white border-border text-grayMid hover:border-navy/30'
            )}
          >
            {f.label}
            {f.value === 'PENDING' && pendingCount > 0 && isManagerOrAdmin && (
              <span className="ml-2 inline-flex items-center justify-center w-5 h-5 bg-red-500 text-white text-xs rounded-full font-bold">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Request Cards */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-5 h-20 animate-pulse bg-bg/50" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="card py-16 flex flex-col items-center gap-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-neon/10 border border-neon/20 flex items-center justify-center">
            <ClipboardList size={24} className="text-neon" />
          </div>
          <div>
            <p className="font-semibold text-navy">No product requests yet</p>
            <p className="text-sm text-grayMid mt-1">
              {isInventoryStaff ? 'Spotted a new product? Submit a request!' : 'No requests from staff yet.'}
            </p>
          </div>
          {isInventoryStaff && (
            <button onClick={() => navigate('/products/requests/new')} className="btn-primary">
              <Plus size={16} /> Submit Request
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <RequestCard
              key={req.id}
              request={req}
              isManagerOrAdmin={isManagerOrAdmin}
              onApprove={(r) => setApproveModal({ open: true, request: r })}
              onReject={(r) => setRejectModal({ open: true, request: r })}
            />
          ))}
        </div>
      )}

      {/* Approve Modal */}
      <Modal
        isOpen={approveModal.open}
        onClose={() => setApproveModal({ open: false, request: null })}
        title={`Approve: ${approveModal.request?.name}`}
        size="md"
      >
        {approveModal.request && (
          <ApproveModal
            request={approveModal.request}
            categories={categories}
            onClose={() => setApproveModal({ open: false, request: null })}
            onConfirm={handleApprove}
            loading={actionLoading}
          />
        )}
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={rejectModal.open}
        onClose={() => setRejectModal({ open: false, request: null })}
        title="Reject Request"
        size="sm"
      >
        {rejectModal.request && (
          <RejectModal
            request={rejectModal.request}
            onClose={() => setRejectModal({ open: false, request: null })}
            onConfirm={handleReject}
            loading={actionLoading}
          />
        )}
      </Modal>
    </motion.div>
  );
}
