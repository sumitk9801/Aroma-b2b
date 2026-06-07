const { prisma } = require("../db/db");
const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, '../logs/socket.log');

const logSocket = (msg) => {
    try {
        fs.appendFileSync(logFile, `${new Date().toISOString()} - ${msg}\n`);
    } catch (err) {
        console.error(err);
    }
};

// Helper function to fetch pending refunds and format them for the client
const sendPendingRefunds = async (io, shopId) => {
    try {
        const refunds = await prisma.refund.findMany({
            where: {
                shopId,
                status: "PENDING"
            },
            orderBy: {
                createdAt: "asc"
            }
        });
        
        const formatted = refunds.map(r => ({
            id: `REF-${String(r.refundCode).padStart(3, '0')}`,
            dbId: r.id,
            amount: r.amount,
            items: r.items,
            cashier: r.cashierName,
            date: r.createdAt.toISOString()
        }));

        logSocket(`Emitting refund-list-update to shop_${shopId} with ${formatted.length} items`);
        io.to(`shop_${shopId}`).emit("refund-list-update", formatted);
    } catch (err) {
        logSocket(`Error sending pending refunds: ${err.message}`);
        console.error("Error sending pending refunds:", err);
    }
};

module.exports = (io) => {
    io.on("connection", (socket) => {
        logSocket(`Client connected to socket: ${socket.id}`);

        socket.on("join-shop", async (shopId) => {
            if (!shopId) return;
            socket.join(`shop_${shopId}`);
            logSocket(`Socket ${socket.id} joined shop_${shopId}`);

            try {
                // Fetch and send current list to the newly joined client only
                const refunds = await prisma.refund.findMany({
                    where: {
                        shopId,
                        status: "PENDING"
                    },
                    orderBy: {
                        createdAt: "asc"
                    }
                });
                
                const formatted = refunds.map(r => ({
                    id: `REF-${String(r.refundCode).padStart(3, '0')}`,
                    dbId: r.id,
                    amount: r.amount,
                    items: r.items,
                    cashier: r.cashierName,
                    date: r.createdAt.toISOString()
                }));
                logSocket(`Sending initial refund-list-update to socket ${socket.id} with ${formatted.length} items`);
                socket.emit("refund-list-update", formatted);
            } catch (err) {
                logSocket(`Error in join-shop: ${err.message}`);
                console.error("Error in join-shop refund query:", err);
            }
        });

        socket.on("approve-refund", async ({ shopId, refundId }) => {
            logSocket(`Approve refund request received: ${refundId} for shop: ${shopId}`);
            if (!shopId || !refundId) return;
            try {
                let refund = null;
                const codeMatch = refundId.match(/REF-(\d+)/);
                if (codeMatch) {
                    const code = parseInt(codeMatch[1]);
                    refund = await prisma.refund.findFirst({
                        where: {
                            shopId,
                            refundCode: code
                        }
                    });
                } else {
                    // Try UUID fallback
                    refund = await prisma.refund.findUnique({
                        where: {
                            id: refundId
                        }
                    });
                }

                if (refund && refund.status === "PENDING") {
                    // Update to APPROVED
                    await prisma.refund.update({
                        where: { id: refund.id },
                        data: { status: "APPROVED" }
                    });
                    logSocket(`Refund request ${refundId} marked APPROVED in DB`);

                    // Sync updated list to shop room
                    await sendPendingRefunds(io, shopId);

                    // Emit status update notification to everyone in the shop
                    io.to(`shop_${shopId}`).emit("refund-status-updated", {
                        id: refundId,
                        status: "approved",
                        cashier: refund.cashierName,
                        amount: refund.amount
                    });
                } else {
                    logSocket(`Refund request ${refundId} not found or not PENDING`);
                }
            } catch (err) {
                logSocket(`Error in approve-refund: ${err.message}`);
                console.error("Error in approve-refund:", err);
            }
        });

        socket.on("reject-refund", async ({ shopId, refundId }) => {
            logSocket(`Reject refund request received: ${refundId} for shop: ${shopId}`);
            if (!shopId || !refundId) return;
            try {
                let refund = null;
                const codeMatch = refundId.match(/REF-(\d+)/);
                if (codeMatch) {
                    const code = parseInt(codeMatch[1]);
                    refund = await prisma.refund.findFirst({
                        where: {
                            shopId,
                            refundCode: code
                        }
                    });
                } else {
                    // Try UUID fallback
                    refund = await prisma.refund.findUnique({
                        where: {
                            id: refundId
                        }
                    });
                }

                if (refund && refund.status === "PENDING") {
                    // Update to REJECTED
                    await prisma.refund.update({
                        where: { id: refund.id },
                        data: { status: "REJECTED" }
                    });
                    logSocket(`Refund request ${refundId} marked REJECTED in DB`);

                    // Sync updated list to shop room
                    await sendPendingRefunds(io, shopId);

                    // Emit status update notification to everyone in the shop
                    io.to(`shop_${shopId}`).emit("refund-status-updated", {
                        id: refundId,
                        status: "rejected",
                        cashier: refund.cashierName,
                        amount: refund.amount
                    });
                } else {
                    logSocket(`Refund request ${refundId} not found or not PENDING`);
                }
            } catch (err) {
                logSocket(`Error in reject-refund: ${err.message}`);
                console.error("Error in reject-refund:", err);
            }
        });

        socket.on("request-refund", async ({ shopId, cashier, amount, items }) => {
            logSocket(`Request refund received: shop=${shopId}, cashier=${cashier}, amount=${amount}, items=${items}`);
            if (!shopId || !amount || !items) return;
            try {
                // Create refund record
                const newRefund = await prisma.refund.create({
                    data: {
                        shopId,
                        cashierName: cashier || 'Staff Member',
                        amount: parseFloat(amount),
                        items: items,
                        status: "PENDING"
                    }
                });

                const formattedId = `REF-${String(newRefund.refundCode).padStart(3, '0')}`;
                logSocket(`Created refund record in DB: ${formattedId}`);

                // Sync updated list to shop room
                await sendPendingRefunds(io, shopId);

                // Broadcast request notification to shop room
                io.to(`shop_${shopId}`).emit("refund-requested", {
                    id: formattedId,
                    dbId: newRefund.id,
                    amount: newRefund.amount,
                    items: newRefund.items,
                    cashier: newRefund.cashierName,
                    date: newRefund.createdAt.toISOString()
                });
            } catch (err) {
                logSocket(`Error in request-refund: ${err.message}`);
                console.error("Error in request-refund:", err);
            }
        });

        socket.on("disconnect", () => {
            logSocket(`Client disconnected from socket: ${socket.id}`);
        });
    });
};
