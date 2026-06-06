import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import { selectActiveShopId, selectActiveShopRole } from '../store/slices/uiSlice';
import { selectIsAuthenticated, selectUser } from '../store/slices/authSlice';
import { toast } from 'sonner';

let socket = null;

export const getSocket = () => socket;

export function useRefundSocket() {
  const activeShopId = useSelector(selectActiveShopId);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);
  const activeShopRole = useSelector(selectActiveShopRole);

  const userRole = (activeShopRole || user?.role || 'staff').toUpperCase();

  useEffect(() => {
    if (!isAuthenticated || !activeShopId) {
      if (socket) {
        socket.disconnect();
        socket = null;
      }
      return;
    }

    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';
    socket = io(socketUrl, {
      withCredentials: true
    });

    socket.emit('join-shop', activeShopId);

    // Global listener for refund notifications
    socket.on('refund-status-updated', (data) => {
      const { id, status, cashier, amount } = data;
      const isMyRefund = user?.name === cashier;

      if (status === 'approved') {
        const title = isMyRefund 
          ? `Your refund request ${id} has been APPROVED!` 
          : `Refund request ${id} has been APPROVED!`;
        toast.success(title, {
          description: `₹${amount} • Submitted by ${cashier}`,
          duration: 8000
        });
      } else {
        const title = isMyRefund 
          ? `Your refund request ${id} was rejected.` 
          : `Refund request ${id} was rejected.`;
        toast.error(title, {
          description: `₹${amount} • Submitted by ${cashier}`,
          duration: 8000
        });
      }
    });

    // Notify managers/admins about new requests
    socket.on('refund-requested', (data) => {
      const isMyRequest = user?.name === data.cashier;
      if (!isMyRequest && (userRole === 'MANAGER' || userRole === 'ADMIN')) {
        toast.info(`New Refund Request: ${data.id}`, {
          description: `${data.cashier} requested ₹${data.amount} for ${data.items}`,
          duration: 8000
        });
      }
    });

    return () => {
      if (socket) {
        socket.disconnect();
        socket = null;
      }
    };
  }, [isAuthenticated, activeShopId, user, userRole]);
}
