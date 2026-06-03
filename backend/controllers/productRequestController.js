const productRequestService = require("../services/productRequestService");

const createRequest = async (req, res, next) => {
    try {
        const shopId = req.shopId || req.body.shopId;
        if (!shopId) return res.status(400).json({ success: false, message: "Shop context required" });
        const request = await productRequestService.createRequest(req.body, req.user.id, shopId);
        res.status(201).json({ success: true, message: "Product request submitted successfully", data: request });
    } catch (err) { next(err); }
};

const getAllRequests = async (req, res, next) => {
    try {
        const shopId = req.shopId || req.query.shopId;
        if (!shopId) return res.status(400).json({ success: false, message: "Shop context required" });

        // INVENTORY_STAFF can only see their own requests
        const role = (req.user?.shopRole || req.user?.role || "").toUpperCase();
        const isStaff = role === "INVENTORY_STAFF" || role === "STAFF";
        const filters = {
            status: req.query.status,
            requestedBy: isStaff ? req.user.id : req.query.requestedBy,
        };
        const requests = await productRequestService.getAllRequests(shopId, filters);
        res.json({ success: true, data: requests });
    } catch (err) { next(err); }
};

const getRequestById = async (req, res, next) => {
    try {
        const shopId = req.shopId || req.query.shopId;
        const request = await productRequestService.getRequestById(req.params.id, shopId);
        res.json({ success: true, data: request });
    } catch (err) { next(err); }
};

const getPendingCount = async (req, res, next) => {
    try {
        const shopId = req.shopId || req.query.shopId;
        if (!shopId) return res.status(400).json({ success: false, message: "Shop context required" });
        const count = await productRequestService.getPendingCount(shopId);
        res.json({ success: true, data: { pendingCount: count } });
    } catch (err) { next(err); }
};

const approveRequest = async (req, res, next) => {
    try {
        const shopId = req.shopId || req.body.shopId;
        if (!shopId) return res.status(400).json({ success: false, message: "Shop context required" });
        const result = await productRequestService.approveRequest(req.params.id, req.body, req.user.id, shopId);
        res.json({ success: true, message: "Request approved — product created successfully", data: result });
    } catch (err) { next(err); }
};

const rejectRequest = async (req, res, next) => {
    try {
        const shopId = req.shopId || req.body.shopId;
        if (!shopId) return res.status(400).json({ success: false, message: "Shop context required" });
        const request = await productRequestService.rejectRequest(req.params.id, req.body.reviewNote, req.user.id, shopId);
        res.json({ success: true, message: "Request rejected", data: request });
    } catch (err) { next(err); }
};

module.exports = { createRequest, getAllRequests, getRequestById, getPendingCount, approveRequest, rejectRequest };
