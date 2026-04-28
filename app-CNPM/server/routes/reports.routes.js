const express = require("express");
const router  = express.Router();
const reportController = require("../controllers/report.controller");

// GET /api/reports/revenue?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get("/revenue", reportController.getRevenue);

// GET /api/reports/profit?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get("/profit", reportController.getProfit);

// GET /api/reports/revenue-by-medicine?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get("/revenue-by-medicine", reportController.getRevenueByMedicine);

// GET /api/reports/monthly-summary?year=YYYY
router.get("/monthly-summary", reportController.getMonthlySummary);

// GET /api/reports/slow-moving?days=90&threshold=10
router.get("/slow-moving", reportController.getSlowMoving);

// GET /api/reports/fast-moving?days=30&top=10
router.get("/fast-moving", reportController.getFastMoving);

module.exports = router;
