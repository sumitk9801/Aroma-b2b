const express = require("express");
const router = express.Router();
const { auth, checkShopContext, allowRoles } = require("../middleware/authMiddleware");
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

router.post("/", auth, checkShopContext, allowRoles("ADMIN", "MANAGER"), validate(createProductSchema), createProduct);
router.get("/", auth, checkShopContext, getProducts);
router.get("/low-stock", auth, checkShopContext, getLowStockProducts);
router.get("/:id", auth, checkShopContext, validate(getByIdSchema), getProductById);
router.patch("/:id", auth, checkShopContext, allowRoles("ADMIN", "MANAGER"), validate(updateProductSchema), updateProduct);
router.delete("/:id", auth, checkShopContext, allowRoles("ADMIN"), validate(getByIdSchema), deleteProduct);

module.exports = router;
    