const express = require("express");
const router = express.Router();
const { auth, authorize } = require("../middleware/authMiddleware");
const { getUsers, getUserById, createUser, updateUser, deleteUser } = require("../controllers/usersController");
const validate = require("../middleware/validate");
const { createUserSchema, updateUserSchema, getByIdSchema } = require("../middleware/validationSchemas");

// GET /users?shopId=<id>   — get all staff for a shop
router.get("/", auth, authorize, getUsers);
router.get("/:id", auth, authorize, validate(getByIdSchema), getUserById);
// POST /users — body must include shopId
router.post("/", auth, authorize, validate(createUserSchema), createUser);
router.put("/:id", auth, authorize, validate(updateUserSchema), updateUser);
// DELETE /users/:id?shopId=<id> — remove staff from a shop
router.delete("/:id", auth, authorize, validate(getByIdSchema), deleteUser);
router.patch("/:id", auth, authorize, validate(updateUserSchema), updateUser);

module.exports = router;
