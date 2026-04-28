const express = require("express");
const router = express.Router();
const db = require("../config/db");

// GET /api/batches?medicine_id=  ← FEFO order
router.get("/", async (req, res) => {
  try {
    const { medicine_id } = req.query;
    let sql = `
      SELECT b.*, m.name AS medicine_name, w.name AS warehouse_name
      FROM batches b
      JOIN medicines m ON m.id = b.medicine_id
      LEFT JOIN warehouses w ON w.id = b.warehouse_id
      WHERE b.quantity > 0
    `;
    const params = [];
    if (medicine_id) {
      sql += ` AND b.medicine_id = ?`;
      params.push(medicine_id);
    }
    sql += ` ORDER BY b.expiry_date ASC`;

    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
