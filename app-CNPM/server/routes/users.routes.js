const express = require("express");
const router = express.Router();

const userController = require("../controllers/user.controller");

router.get("/me/profile", userController.get);
router.put("/me/profile", userController.update);
router.put("/me/change-password", userController.updatePassword);

module.exports = router;
