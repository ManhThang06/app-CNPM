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

  /**
   * Dời thuốc từ tủ này sang tủ khác.
   * @param {Object} data { batchId, fromPosition, toPosition, quantity }
   */
  async move(data) {
    const { batchId, toPosition, quantity } = data;
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // 1. Kiểm tra batch nguồn
      const [[batch]] = await conn.query("SELECT * FROM batches WHERE id = ?", [batchId]);
      if (!batch) throw new Error("Không tìm thấy lô hàng nguồn");
      if (batch.quantity < quantity) throw new Error("Số lượng trong tủ không đủ để dời");

      // 2. Trừ số lượng ở batch nguồn
      await conn.query("UPDATE batches SET quantity = quantity - ? WHERE id = ?", [quantity, batchId]);

      // 3. Tạo batch mới ở vị trí mới (copy thông tin từ batch cũ)
      const [insertResult] = await conn.query(
        `INSERT INTO batches (medicine_id, batch_code, quantity, import_date, expiry_date, position)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [batch.medicine_id, batch.batch_code, quantity, batch.import_date, batch.expiry_date, toPosition]
      );
      const newBatchId = insertResult.insertId;

      // 4. Ghi log
      await conn.query(
        `INSERT INTO inventory_logs (medicine_id, batch_id, change_amount, type, note)
         VALUES (?, ?, ?, 'ADJUST', ?)`,
        [batch.medicine_id, batchId, -quantity, `Dời ${quantity} đơn vị sang vị trí ${toPosition}`]
      );
      await conn.query(
        `INSERT INTO inventory_logs (medicine_id, batch_id, change_amount, type, note)
         VALUES (?, ?, ?, 'ADJUST', ?)`,
        [batch.medicine_id, newBatchId, quantity, `Nhận ${quantity} đơn vị dời từ vị trí ${batch.position}`]
      );

      await conn.commit();
      return { newBatchId };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  /**
   * Điều chỉnh số lượng thuốc (sai số kiểm kho).
   * @param {Object} data { batchId, newQuantity, note }
   */
  async adjust(data) {
    const { batchId, newQuantity, note } = data;
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // 1. Kiểm tra batch
      const [[batch]] = await conn.query("SELECT * FROM batches WHERE id = ?", [batchId]);
      if (!batch) throw new Error("Không tìm thấy lô hàng");

      const diff = newQuantity - batch.quantity;
      if (diff === 0) return;

      // 2. Cập nhật số lượng
      await conn.query("UPDATE batches SET quantity = ? WHERE id = ?", [newQuantity, batchId]);

      // 3. Ghi log
      await conn.query(
        `INSERT INTO inventory_logs (medicine_id, batch_id, change_amount, type, note)
         VALUES (?, ?, ?, 'ADJUST', ?)`,
        [batch.medicine_id, batchId, diff, note || `Điều chỉnh số lượng từ ${batch.quantity} thành ${newQuantity}`]
      );

      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },
};

module.exports = Inventory;
