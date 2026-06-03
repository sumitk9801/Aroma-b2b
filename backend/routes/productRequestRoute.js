const express = require("express");
const router  = express.Router();
const { auth, checkShopContext, allowRoles } = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");
const {
    createProductRequestSchema,
    approveProductRequestSchema,
    rejectProductRequestSchema,
    getByIdSchema,
} = require("../middleware/validationSchemas");
const {
    createRequest,
    getAllRequests,
    getRequestById,
    getPendingCount,
    approveRequest,
    rejectRequest,
} = require("../controllers/productRequestController");

// All routes require authentication + shop context
router.use(auth, checkShopContext);

// Submit a new request — any authenticated shop member
router.post("/", validate(createProductRequestSchema), createRequest);

// List all requests — visible to all roles (controller scopes INVENTORY_STAFF to own)
router.get("/", getAllRequests);

// Pending count badge — Admin & Manager
router.get("/pending-count", allowRoles("ADMIN", "MANAGER"), getPendingCount);

// Get single request
router.get("/:id", validate(getByIdSchema), getRequestById);

// Approve — Admin & Manager only
router.patch("/:id/approve", allowRoles("ADMIN", "MANAGER"), validate(approveProductRequestSchema), approveRequest);

// Reject — Admin & Manager only
router.patch("/:id/reject", allowRoles("ADMIN", "MANAGER"), validate(rejectProductRequestSchema), rejectRequest);

module.exports = router;
