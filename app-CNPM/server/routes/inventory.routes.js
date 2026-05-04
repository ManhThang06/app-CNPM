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
        b.position,
        b.medicine_id,
        CASE
          WHEN b.expiry_date < NOW() THEN 'expired'
          WHEN b.expiry_date <= DATE_ADD(NOW(), INTERVAL 30 DAY) THEN 'near'
          ELSE 'safe'
        END AS status
      FROM batches b
      JOIN medicines m ON m.id = b.medicine_id
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

// GET /api/inventory/map ← dữ liệu sơ đồ kho: tất cả batch + trạng thái tủ đầy
router.get("/map", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        b.id,
        b.batch_code,
        b.quantity,
        b.expiry_date,
        b.position,
        COALESCE(c.is_full, b.cabinet_is_full) AS cabinet_is_full,
        m.id   AS medicine_id,
        m.name AS medicine_name
      FROM batches b
      JOIN medicines m ON m.id = b.medicine_id
      LEFT JOIN cabinets c ON c.id = b.position
      WHERE b.quantity > 0 
        AND b.position IS NOT NULL 
        AND b.position != ''

      UNION

      SELECT 
        NULL AS id,
        NULL AS batch_code,
        0 AS quantity,
        NULL AS expiry_date,
        c.id AS position,
        c.is_full AS cabinet_is_full,
        NULL AS medicine_id,
        NULL AS medicine_name
      FROM cabinets c
      WHERE c.is_full = 1
        AND c.id NOT IN (SELECT position FROM batches WHERE quantity > 0 AND position IS NOT NULL)
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/inventory/cabinets/:key/full ← đánh dấu đầy / bỏ đánh dấu
router.put("/cabinets/:key/full", async (req, res) => {
  try {
    console.log("Debug full route - user:", req.user);
    if (req.user?.role !== "STOREKEEPER") {
      return res.status(403).json({ message: `Chỉ thủ kho mới có quyền thực hiện thao tác này. Quyền của bạn: ${req.user?.role || 'null'}` });
    }
    const key   = req.params.key;
    const isFull = req.body.is_full === true || req.body.is_full === 1;

    // Cập nhật bảng cabinets (để lưu trạng thái bền vững kể cả khi tủ trống)
    await db.query(
      `INSERT INTO cabinets (id, is_full) VALUES (?, ?) ON DUPLICATE KEY UPDATE is_full = ?`,
      [key, isFull ? 1 : 0, isFull ? 1 : 0]
    );

    // Cập nhật bảng batches (để tương thích ngược với logic cũ nếu cần)
    await db.query(
      `UPDATE batches SET cabinet_is_full = ? WHERE position = ?`,
      [isFull ? 1 : 0, key]
    );

    res.json({ message: "Cập nhật trạng thái tủ thành công", position: key, is_full: isFull });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/inventory/move ← dời thuốc giữa các tủ
router.post("/move", async (req, res, next) => {
  if (req.user?.role !== "STOREKEEPER") {
    return res.status(403).json({ message: `Chỉ thủ kho mới có quyền thực hiện thao tác này. Quyền của bạn: ${req.user?.role || 'null'}` });
  }
  next();
}, inventoryController.move);

// PATCH /api/inventory/adjust ← điều chỉnh số lượng
router.patch("/adjust", async (req, res, next) => {
  if (req.user?.role !== "STOREKEEPER") {
    return res.status(403).json({ message: `Chỉ thủ kho mới có quyền thực hiện thao tác này. Quyền của bạn: ${req.user?.role || 'null'}` });
  }
  next();
}, inventoryController.adjust);

module.exports = router;
