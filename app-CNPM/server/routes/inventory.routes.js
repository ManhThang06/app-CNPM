const express = require("express");
const router = express.Router();
const db = require("../config/db");
const inventoryController = require("../controllers/inventory.controller");

// GET /api/inventory  ← tất cả batches JOIN medicines JOIN warehouses, kèm computed status
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        b.id,
        b.batch_code   AS batchName,
        m.name         AS productName,
        b.quantity,
        b.expiry_date  AS expiryDate,
        w.name         AS warehouse,
        b.position,
        b.medicine_id,
        b.warehouse_id,
        CASE
          WHEN b.expiry_date < NOW() THEN 'expired'
          WHEN b.expiry_date <= DATE_ADD(NOW(), INTERVAL 30 DAY) THEN 'near'
          ELSE 'safe'
        END AS status
      FROM batches b
      JOIN medicines m ON m.id = b.medicine_id
      LEFT JOIN warehouses w ON w.id = b.warehouse_id
      WHERE b.quantity > 0
      ORDER BY b.expiry_date ASC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/inventory/threshold-alerts ← thuốc có tồn kho <= min_stock
router.get("/threshold-alerts", inventoryController.getThresholdAlerts);

// GET /api/inventory/map ← dữ liệu sơ đồ kho: tất cả batch, group theo floor/room/cabinet
router.get("/map", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        b.id,
        b.batch_code,
        b.quantity,
        b.expiry_date,
        b.position,
        b.cabinet_is_full,
        m.id   AS medicine_id,
        m.name AS medicine_name
      FROM batches b
      JOIN medicines m ON m.id = b.medicine_id
      WHERE b.quantity > 0
        AND b.position IS NOT NULL
        AND b.position != ''
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/inventory/cabinets/:key/full ← đánh dấu đầy / bỏ đánh dấu
// key = ví dụ: "F1-A-M3" (floor-room-cabinet)
router.put("/cabinets/:key/full", async (req, res) => {
  try {
    const key   = req.params.key;           // e.g. "F1-A-M3"
    const isFull = req.body.is_full === true || req.body.is_full === 1;

    await db.query(
      `UPDATE batches SET cabinet_is_full = ? WHERE position = ?`,
      [isFull ? 1 : 0, key]
    );

    res.json({ message: "Cập nhật trạng thái tủ thành công", position: key, is_full: isFull });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
