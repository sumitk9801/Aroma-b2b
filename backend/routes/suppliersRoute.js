const express = require("express");
const router = express.Router();
const { auth, checkShopContext, allowRoles } = require("../middleware/authMiddleware");
const {
    getAllSuppliers, getSupplierById, createSupplier,
    updateSupplier, deleteSupplier, getSupplierStats
} = require("../controllers/supplierController");

router.get("/", auth, checkShopContext, allowRoles("ADMIN", "MANAGER"), getAllSuppliers);
router.post("/", auth, checkShopContext, allowRoles("ADMIN", "MANAGER"), createSupplier);
router.get("/stats", auth, checkShopContext, allowRoles("ADMIN", "MANAGER"), getSupplierStats);
router.get("/:id", auth, checkShopContext, allowRoles("ADMIN", "MANAGER"), getSupplierById);
router.put("/:id", auth, checkShopContext, allowRoles("ADMIN", "MANAGER"), updateSupplier);
router.delete("/:id", auth, checkShopContext, allowRoles("ADMIN"), deleteSupplier);

module.exports = router;
