const express = require("express");
const router = express.Router();
const { auth, checkShopContext, allowRoles } = require("../middleware/authMiddleware");
const {
    createPurchase,
    getPurchases,
    getPurchaseById,
    getPurchasesByProduct
} = require("../controllers/purchaseController");
const validate = require("../middleware/validate");
const { createPurchaseSchema, getByIdSchema, getByProductSchema } = require("../middleware/validationSchemas");

router.post("/", auth, checkShopContext, allowRoles("ADMIN", "MANAGER"), validate(createPurchaseSchema), createPurchase);
router.get("/", auth, checkShopContext, allowRoles("ADMIN", "MANAGER"), getPurchases);
router.get("/:id", auth, checkShopContext, allowRoles("ADMIN", "MANAGER"), validate(getByIdSchema), getPurchaseById);
router.get("/product/:productId", auth, checkShopContext, allowRoles("ADMIN", "MANAGER"), validate(getByProductSchema), getPurchasesByProduct);

module.exports = router;