const express = require("express");
const router = express.Router();
const db = require("../config/db");

// GET /api/dashboard/summary
router.get("/summary", async (req, res) => {
  try {
    const [[{ totalSkus }]] = await db.query(
      `SELECT COUNT(DISTINCT medicine_id) AS totalSkus FROM batches WHERE quantity > 0`
    );

    const [[{ totalBatches }]] = await db.query(
      `SELECT COUNT(*) AS totalBatches FROM batches WHERE quantity > 0`
    );

    const [[{ nearExpiryCount }]] = await db.query(
      `SELECT COUNT(*) AS nearExpiryCount FROM batches
       WHERE expiry_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 6 MONTH)
         AND quantity > 0`
    );

    const [[{ expiredCount }]] = await db.query(
      `SELECT COUNT(*) AS expiredCount FROM batches
       WHERE expiry_date < NOW() AND quantity > 0`
    );

    const [capacityRows] = await db.query(
      `SELECT warehouse_id, SUM(quantity) AS total
       FROM batches WHERE quantity > 0
       GROUP BY warehouse_id`
    );
    const warehouseCapacity = {};
    for (const row of capacityRows) {
      warehouseCapacity[row.warehouse_id] = Number(row.total);
    }

    res.json({
      totalSkus: Number(totalSkus),
      totalBatches: Number(totalBatches),
      nearExpiryCount: Number(nearExpiryCount),
      expiredCount: Number(expiredCount),
      warehouseCapacity,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
