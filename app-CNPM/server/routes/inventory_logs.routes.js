const express = require("express");
const router = express.Router();
const db = require("../config/db");

// GET /api/inventory-logs?type=IMPORT|EXPORT
router.get("/", async (req, res) => {
  try {
    const { type } = req.query;
    let sql = `
      SELECT
        il.*,
        m.name  AS medicine_name,
        b.batch_code,
        u.name  AS user_name
      FROM inventory_logs il
      JOIN medicines m ON m.id = il.medicine_id
      LEFT JOIN batches b ON b.id = il.batch_id
      LEFT JOIN users u ON (
        il.ref_type = 'EXPORT_REQUEST' AND u.id = (
          SELECT requester_id FROM export_requests WHERE id = il.ref_id LIMIT 1
        )
      )
      WHERE 1=1
    `;
    const params = [];
    if (type) {
      sql += ` AND il.type = ?`;
      params.push(type);
    }
    sql += ` ORDER BY il.created_at DESC`;

    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
