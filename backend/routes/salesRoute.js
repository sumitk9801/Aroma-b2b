const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/authMiddleware");
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

router.post("/", auth, validate(createSaleSchema), createSale);
router.get("/", auth, getSales);
router.get("/daily", auth, getDailySales);
router.get("/monthly", auth, getMonthlySales);
router.get("/product/:productId", auth, validate(getByProductSchema), getSalesByProduct);
router.get("/:id", auth, validate(getByIdSchema), getSaleById);

module.exports = router;