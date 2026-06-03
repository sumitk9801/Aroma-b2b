const express = require("express");
const router = express.Router();
const { auth, checkShopContext, allowRoles } = require("../middleware/authMiddleware");
const {
    createSale,
    getSales,
    getSaleById,
    getSalesByProduct,
    getDailySales,
    getMonthlySales
} = require("../controllers/saleController");
const validate = require("../middleware/validate");
const { createSaleSchema, getByIdSchema, getByProductSchema } = require("../middleware/validationSchemas");

router.post("/", auth, checkShopContext, allowRoles("ADMIN", "MANAGER", "CASHIER"), validate(createSaleSchema), createSale);
router.get("/", auth, checkShopContext, allowRoles("ADMIN", "MANAGER"), getSales);
router.get("/daily", auth, checkShopContext, allowRoles("ADMIN", "MANAGER"), getDailySales);
router.get("/monthly", auth, checkShopContext, allowRoles("ADMIN", "MANAGER"), getMonthlySales);
router.get("/product/:productId", auth, checkShopContext, allowRoles("ADMIN", "MANAGER"), validate(getByProductSchema), getSalesByProduct);
router.get("/:id", auth, checkShopContext, allowRoles("ADMIN", "MANAGER", "CASHIER"), validate(getByIdSchema), getSaleById);

module.exports = router;