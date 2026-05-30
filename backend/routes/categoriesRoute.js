
const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/authMiddleware");
const {
    createCategory,
    getCategories,
    getCategoryById,
    updateCategory,
    deleteCategory
} = require("../controllers/categoryController");
const validate = require("../middleware/validate");
const { createCategorySchema, updateCategorySchema, getByIdSchema } = require("../middleware/validationSchemas");

router.post("/", auth, validate(createCategorySchema), createCategory);
router.get("/", auth, getCategories);
router.get("/:id", auth, validate(getByIdSchema), getCategoryById);
router.patch("/:id", auth, validate(updateCategorySchema), updateCategory);
router.delete("/:id", auth, validate(getByIdSchema), deleteCategory);

module.exports = router;