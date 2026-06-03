const { prisma } = require("../db/db");

const REQUEST_INCLUDE = {
    requester: { select: { id: true, name: true, email: true } },
    reviewer:  { select: { id: true, name: true, email: true } },
    shop:      { select: { id: true, shopName: true, shopCode: true } },
    product:   { select: { id: true, name: true, skuCode: true } },
};

// ── Create a new product request (INVENTORY_STAFF) ────────────────────────────
const createRequest = async (body, userId, shopId) => {
    const { name, description, barcodes, suggestedPrice, categoryHint, quantity, supplierHint } = body;
    return await prisma.productRequest.create({
        data: {
            shopId,
            requestedBy: userId,
            name,
            description,
            barcodes,
            suggestedPrice: suggestedPrice !== undefined ? parseFloat(suggestedPrice) : null,
            categoryHint,
            quantity: quantity !== undefined ? parseFloat(quantity) : null,
            supplierHint,
        },
        include: REQUEST_INCLUDE,
    });
};

// ── List requests for a shop (with optional status filter) ────────────────────
const getAllRequests = async (shopId, { status, requestedBy } = {}) => {
    const where = { shopId };
    if (status) where.status = status.toUpperCase();
    if (requestedBy) where.requestedBy = requestedBy;

    return await prisma.productRequest.findMany({
        where,
        include: REQUEST_INCLUDE,
        orderBy: { createdAt: "desc" },
    });
};

// ── Get single request ────────────────────────────────────────────────────────
const getRequestById = async (id, shopId) => {
    const request = await prisma.productRequest.findFirst({
        where: { id, shopId },
        include: REQUEST_INCLUDE,
    });
    if (!request) throw new Error("Product request not found");
    return request;
};

// ── Pending count helper ──────────────────────────────────────────────────────
const getPendingCount = async (shopId) => {
    return await prisma.productRequest.count({ where: { shopId, status: "PENDING" } });
};

// ── Approve: create the real Product in a transaction ────────────────────────
const approveRequest = async (id, approvalData, reviewerId, shopId) => {
    const request = await prisma.productRequest.findFirst({ where: { id, shopId } });
    if (!request) throw new Error("Product request not found");
    if (request.status !== "PENDING") throw new Error("This request has already been reviewed");

    const {
        categoryId,
        skuCode,
        purchasePrice = 0,
        sellingPrice  = 0,
        minimumStock  = 5,
        currentStock  = 0,
        reviewNote,
    } = approvalData;

    return await prisma.$transaction(async (tx) => {
        // 1. Create the real product
        const product = await tx.product.create({
            data: {
                shopId,
                categoryId,
                name:         request.name,
                description:  request.description,
                barcodes:     request.barcodes,
                skuCode,
                purchasePrice: parseFloat(purchasePrice),
                sellingPrice:  parseFloat(sellingPrice),
                minimumStock:  parseFloat(minimumStock),
                currentStock:  parseFloat(currentStock),
                isActive: true,
            },
        });

        // 2. Mark request as approved + link the product
        const updated = await tx.productRequest.update({
            where: { id },
            data: {
                status:     "APPROVED",
                reviewNote: reviewNote || null,
                reviewedBy: reviewerId,
                reviewedAt: new Date(),
                productId:  product.id,
            },
            include: REQUEST_INCLUDE,
        });

        return { request: updated, product };
    });
};

// ── Reject request ────────────────────────────────────────────────────────────
const rejectRequest = async (id, reviewNote, reviewerId, shopId) => {
    const request = await prisma.productRequest.findFirst({ where: { id, shopId } });
    if (!request) throw new Error("Product request not found");
    if (request.status !== "PENDING") throw new Error("This request has already been reviewed");

    return await prisma.productRequest.update({
        where: { id },
        data: {
            status:     "REJECTED",
            reviewNote,
            reviewedBy: reviewerId,
            reviewedAt: new Date(),
        },
        include: REQUEST_INCLUDE,
    });
};

module.exports = {
    createRequest,
    getAllRequests,
    getRequestById,
    getPendingCount,
    approveRequest,
    rejectRequest,
};
