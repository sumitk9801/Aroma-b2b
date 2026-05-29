const express = require("express");
const router = express.Router();
const { auth, authorize } = require("../middleware/authMiddleware");
const { getUsers, getUserById, createUser, updateUser, deleteUser } = require("../controllers/usersController");

router.get("/", authorize, getUsers);
router.get("/:id", authorize, getUserById);
router.post("/", authorize, createUser);
router.put("/:id", authorize, updateUser);
router.delete("/:id", authorize, deleteUser);

module.exports = router;