const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/export_request.controller");

router.get("/my", ctrl.getMy);
router.get("/", ctrl.getAll);
router.post("/", ctrl.create);
router.patch("/:id/approve", ctrl.approve);
router.patch("/:id/reject", ctrl.reject);
router.patch("/:id/complete", ctrl.complete);

module.exports = router;
