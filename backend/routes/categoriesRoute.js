
const express = require("express");
const router = express.Router();
const { auth, checkShopContext, allowRoles } = require("../middleware/authMiddleware");
const {
    createCategory,
    getCategories,
    getCategoryById,
    updateCategory,
    deleteCategory
} = require("../controllers/categoryController");
const validate = require("../middleware/validate");
const { createCategorySchema, updateCategorySchema, getByIdSchema } = require("../middleware/validationSchemas");

router.post("/", auth, checkShopContext, allowRoles("ADMIN", "MANAGER"), validate(createCategorySchema), createCategory);
router.get("/", auth, checkShopContext, getCategories);
router.get("/:id", auth, checkShopContext, validate(getByIdSchema), getCategoryById);
router.patch("/:id", auth, checkShopContext, allowRoles("ADMIN", "MANAGER"), validate(updateCategorySchema), updateCategory);
router.delete("/:id", auth, checkShopContext, allowRoles("ADMIN", "MANAGER"), validate(getByIdSchema), deleteCategory);

module.exports = router;