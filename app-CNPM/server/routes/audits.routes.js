const express = require("express");
const router = express.Router();
const auditController = require("../controllers/audit.controller");

router.get("/", auditController.getAll);
router.get("/:id", auditController.get);
router.post("/", auditController.create);
router.post("/:id/items", auditController.addItem);
router.patch("/:id/confirm", auditController.confirm);

module.exports = router;
