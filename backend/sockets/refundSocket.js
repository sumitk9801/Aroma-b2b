const pendingRefunds = new Map();

const getInitialMockRefunds = () => [
    { id: 'REF-042', amount: 45, items: 'Aroma Perfume Oil x1', cashier: 'Sarah M.', date: '10m ago' },
    { id: 'REF-043', amount: 19, items: 'Vanilla Extract x2', cashier: 'Alex W.', date: '40m ago' }
];

module.exports = (io) => {
    io.on("connection", (socket) => {
        console.log("Client connected to socket:", socket.id);

        socket.on("join-shop", (shopId) => {
            if (!shopId) return;
            socket.join(`shop_${shopId}`);
            console.log(`Socket ${socket.id} joined shop_${shopId}`);

            // Initialize mock refunds if not present
            if (!pendingRefunds.has(shopId)) {
                pendingRefunds.set(shopId, getInitialMockRefunds());
            }

            // Send current list to the newly joined client
            socket.emit("refund-list-update", pendingRefunds.get(shopId));
        });

        socket.on("approve-refund", ({ shopId, refundId }) => {
            if (!shopId || !refundId) return;
            let list = pendingRefunds.get(shopId) || [];
            const refund = list.find(r => r.id === refundId);
            if (refund) {
                pendingRefunds.set(shopId, list.filter(r => r.id !== refundId));
                // Sync updated list to shop room
                io.to(`shop_${shopId}`).emit("refund-list-update", pendingRefunds.get(shopId));
                // Emit status update notification to everyone in the shop
                io.to(`shop_${shopId}`).emit("refund-status-updated", {
                    id: refundId,
                    status: "approved",
                    cashier: refund.cashier,
                    amount: refund.amount
                });
            }
        });

        socket.on("reject-refund", ({ shopId, refundId }) => {
            if (!shopId || !refundId) return;
            let list = pendingRefunds.get(shopId) || [];
            const refund = list.find(r => r.id === refundId);
            if (refund) {
                pendingRefunds.set(shopId, list.filter(r => r.id !== refundId));
                // Sync updated list to shop room
                io.to(`shop_${shopId}`).emit("refund-list-update", pendingRefunds.get(shopId));
                // Emit status update notification to everyone in the shop
                io.to(`shop_${shopId}`).emit("refund-status-updated", {
                    id: refundId,
                    status: "rejected",
                    cashier: refund.cashier,
                    amount: refund.amount
                });
            }
        });

        socket.on("request-refund", ({ shopId, cashier, amount, items }) => {
            if (!shopId || !amount || !items) return;
            
            // Initialize mock refunds if not present
            if (!pendingRefunds.has(shopId)) {
                pendingRefunds.set(shopId, getInitialMockRefunds());
            }
            
            let list = pendingRefunds.get(shopId) || [];
            
            // Generate next ID by parsing existing REF-XXX IDs
            const lastIdNum = list.reduce((max, r) => {
                const match = r.id.match(/REF-(\d+)/);
                return match ? Math.max(max, parseInt(match[1])) : max;
            }, 43);
            const nextId = `REF-0${lastIdNum + 1}`;
            
            const newRefund = {
                id: nextId,
                amount: parseFloat(amount),
                items,
                cashier: cashier || 'Staff Member',
                date: 'Just now'
            };
            
            list.push(newRefund);
            pendingRefunds.set(shopId, list);
            
            // Broadcast the updated list to everyone in the shop room
            io.to(`shop_${shopId}`).emit("refund-list-update", list);
            
            // Broadcast request notification to shop room
            io.to(`shop_${shopId}`).emit("refund-requested", newRefund);
        });

        socket.on("disconnect", () => {
            console.log("Client disconnected from socket:", socket.id);
        });
    });
};
