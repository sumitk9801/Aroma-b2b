const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/authMiddleware");
const {
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    getLowStockProducts
} = require("../controllers/productController");
const validate = require("../middleware/validate");
const { createProductSchema, updateProductSchema, getByIdSchema } = require("../middleware/validationSchemas");

router.post("/", auth, validate(createProductSchema), createProduct);
router.get("/", auth, getProducts);
router.get("/low-stock", auth, getLowStockProducts);
router.get("/:id", auth, validate(getByIdSchema), getProductById);
router.patch("/:id", auth, validate(updateProductSchema), updateProduct);
router.delete("/:id", auth, validate(getByIdSchema), deleteProduct);

module.exports = router;
    