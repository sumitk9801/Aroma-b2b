const express = require("express");
const router = express.Router();
const { auth, checkShopContext, allowRoles } = require("../middleware/authMiddleware");
const { getUsers, getUserById, createUser, updateUser, deleteUser } = require("../controllers/usersController");
const validate = require("../middleware/validate");
const { createUserSchema, updateUserSchema, getByIdSchema } = require("../middleware/validationSchemas");

// GET /users?shopId=<id>   — get all staff for a shop
router.get("/", auth, checkShopContext, allowRoles("ADMIN", "MANAGER"), getUsers);
router.get("/:id", auth, checkShopContext, allowRoles("ADMIN", "MANAGER"), validate(getByIdSchema), getUserById);
// POST /users — body must include shopId
router.post("/", auth, checkShopContext, allowRoles("ADMIN"), validate(createUserSchema), createUser);
router.put("/:id", auth, checkShopContext, allowRoles("ADMIN"), validate(updateUserSchema), updateUser);
// DELETE /users/:id?shopId=<id> — remove staff from a shop
router.delete("/:id", auth, checkShopContext, allowRoles("ADMIN"), validate(getByIdSchema), deleteUser);
router.patch("/:id", auth, checkShopContext, allowRoles("ADMIN"), validate(updateUserSchema), updateUser);

module.exports = router;
