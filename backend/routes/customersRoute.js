const express = require("express");
const router = express.Router();
const { auth, checkShopContext, allowRoles } = require("../middleware/authMiddleware");
const {
    getAllCustomers, getCustomerById, createCustomer,
    updateCustomer, deleteCustomer, getCustomerStats
} = require("../controllers/customerController");

// All customer routes require authentication + shop context
router.get("/", auth, checkShopContext, allowRoles("ADMIN", "MANAGER"), getAllCustomers);
router.post("/", auth, checkShopContext, allowRoles("ADMIN", "MANAGER"), createCustomer);
router.get("/stats", auth, checkShopContext, allowRoles("ADMIN", "MANAGER"), getCustomerStats);
router.get("/:id", auth, checkShopContext, allowRoles("ADMIN", "MANAGER"), getCustomerById);
router.put("/:id", auth, checkShopContext, allowRoles("ADMIN", "MANAGER"), updateCustomer);
router.delete("/:id", auth, checkShopContext, allowRoles("ADMIN"), deleteCustomer);

module.exports = router;
