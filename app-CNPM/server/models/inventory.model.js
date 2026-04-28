const db = require("../config/db");

const Inventory = {
  /**
   * Lấy danh sách thuốc có tổng tồn kho <= min_stock (ngưỡng cảnh báo).
   * Chỉ lấy thuốc chưa bị xoá (is_deleted = 0) và có min_stock > 0.
   * Trả về: medicine_id, name, current_stock, min_stock, deficit
   */
  async getBelowThreshold() {
    const [rows] = await db.query(`
      SELECT
        m.id            AS medicine_id,
        m.name,
        COALESCE(SUM(b.quantity), 0)        AS current_stock,
        m.min_stock,
        (m.min_stock - COALESCE(SUM(b.quantity), 0)) AS deficit
      FROM medicines m
      LEFT JOIN batches b ON b.medicine_id = m.id AND b.quantity > 0
      WHERE m.is_deleted = 0
        AND m.min_stock > 0
      GROUP BY m.id, m.name, m.min_stock
      HAVING current_stock <= m.min_stock
      ORDER BY deficit DESC
    `);
    return rows;
  },
};

module.exports = Inventory;
