const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/import_request.controller");

router.get("/", ctrl.getAll);
router.post("/", ctrl.create);
router.patch("/:id/receive", ctrl.receive);
router.patch("/:id/reject", ctrl.reject);

module.exports = router;
