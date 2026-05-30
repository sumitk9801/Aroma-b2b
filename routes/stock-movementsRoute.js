const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/authMiddleware");
const {
    getStockMovements,
    getStockMovementsByProduct,
    adjustStock
} = require("../controllers/stockMovementController");
const validate = require("../middleware/validate");
const { adjustStockSchema, getByProductSchema } = require("../middleware/validationSchemas");

router.get("/", auth, getStockMovements);
router.get("/product/:productId", auth, validate(getByProductSchema), getStockMovementsByProduct);
router.post("/adjust", auth, validate(adjustStockSchema), adjustStock);

module.exports = router;