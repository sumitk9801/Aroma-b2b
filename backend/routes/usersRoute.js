const express = require("express");
const router = express.Router();
const { auth, authorize } = require("../middleware/authMiddleware");
const { getUsers, getUserById, createUser, updateUser, deleteUser } = require("../controllers/usersController");
const validate = require("../middleware/validate");
const { createUserSchema, updateUserSchema, getByIdSchema } = require("../middleware/validationSchemas");

router.get("/", auth, authorize, getUsers);
router.get("/:id", auth, authorize, validate(getByIdSchema), getUserById);
router.post("/", auth, authorize, validate(createUserSchema), createUser);
router.put("/:id", auth, authorize, validate(updateUserSchema), updateUser);
router.delete("/:id", auth, authorize, validate(getByIdSchema), deleteUser);

module.exports = router;