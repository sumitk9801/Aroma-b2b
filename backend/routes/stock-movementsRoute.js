const express = require("express");
const router = express.Router();
const { auth, checkShopContext, allowRoles } = require("../middleware/authMiddleware");
const {
    getStockMovements,
    getStockMovementsByProduct,
    adjustStock,
    receiveStock
} = require("../controllers/stockMovementController");
const validate = require("../middleware/validate");
const { adjustStockSchema, getByProductSchema, receiveStockSchema } = require("../middleware/validationSchemas");

router.get("/", auth, checkShopContext, allowRoles("ADMIN", "MANAGER", "INVENTORY_STAFF"), getStockMovements);
router.get("/product/:productId", auth, checkShopContext, allowRoles("ADMIN", "MANAGER", "INVENTORY_STAFF"), validate(getByProductSchema), getStockMovementsByProduct);
router.post("/adjust", auth, checkShopContext, allowRoles("ADMIN", "MANAGER", "INVENTORY_STAFF"), validate(adjustStockSchema), adjustStock);
router.post("/receive", auth, checkShopContext, allowRoles("ADMIN", "MANAGER", "INVENTORY_STAFF"), validate(receiveStockSchema), receiveStock);

module.exports = router;