const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/authMiddleware");
const {
    createPurchase,
    getPurchases,
    getPurchaseById,
    getPurchasesByProduct
} = require("../controllers/purchaseController");
const validate = require("../middleware/validate");
const { createPurchaseSchema, getByIdSchema, getByProductSchema } = require("../middleware/validationSchemas");

router.post("/", auth, validate(createPurchaseSchema), createPurchase);
router.get("/", auth, getPurchases);
router.get("/:id", auth, validate(getByIdSchema), getPurchaseById);
router.get("/product/:productId", auth, validate(getByProductSchema), getPurchasesByProduct);

module.exports = router;