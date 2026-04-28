const db = require("../config/db");

const Audit = {
  // Lấy tất cả phiên kiểm kê
  async getAll() {
    const [rows] = await db.query(
      `SELECT s.*, u.name AS created_by_name,
              (SELECT COUNT(*) FROM audit_items WHERE session_id = s.id) AS item_count
       FROM audit_sessions s
       LEFT JOIN users u ON u.id = s.created_by
       ORDER BY s.created_at DESC`
    );
    return rows;
  },

  // Lấy chi tiết 1 phiên kiểm kê (kèm items)
  async getById(id) {
    const [[session]] = await db.query(
      `SELECT s.*, u.name AS created_by_name
       FROM audit_sessions s
       LEFT JOIN users u ON u.id = s.created_by
       WHERE s.id = ?`,
      [id]
    );
    if (!session) return null;

    const [items] = await db.query(
      `SELECT ai.*, m.name AS medicine_name, b.batch_code
       FROM audit_items ai
       JOIN medicines m ON m.id = ai.medicine_id
       JOIN batches b ON b.id = ai.batch_id
       WHERE ai.session_id = ?`,
      [id]
    );

    return { session, items };
  },

  // Tạo phiên kiểm kê mới
  async create(createdBy) {
    const [result] = await db.query(
      `INSERT INTO audit_sessions (created_by, status) VALUES (?, 'OPEN')`,
      [createdBy]
    );
    return result.insertId;
  },

  // Thêm item vào phiên kiểm kê
  async addItem(sessionId, { medicine_id, batch_id, system_qty, actual_qty }) {
    const [result] = await db.query(
      `INSERT INTO audit_items (session_id, medicine_id, batch_id, system_qty, actual_qty)
       VALUES (?, ?, ?, ?, ?)`,
      [sessionId, medicine_id, batch_id, system_qty, actual_qty ?? null]
    );
    return result.insertId;
  },

  // Xác nhận phiên kiểm kê: cập nhật batches + ghi inventory_logs
  async confirm(sessionId, submittedItems = []) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [[session]] = await conn.query(
        `SELECT id, status FROM audit_sessions WHERE id = ? FOR UPDATE`,
        [sessionId]
      );

      if (!session) {
        throw new Error("Khong tim thay phien kiem ke");
      }

      if (session.status === "CONFIRMED") {
        throw new Error("Phien kiem ke da duoc xac nhan");
      }

      if (Array.isArray(submittedItems)) {
        for (const item of submittedItems) {
          if (item.id == null || item.actual_qty == null) continue;

          const actualQty = Number(item.actual_qty);
          if (!Number.isFinite(actualQty) || actualQty < 0) {
            throw new Error("So luong thuc te khong hop le");
          }

          await conn.query(
            `UPDATE audit_items SET actual_qty = ? WHERE id = ? AND session_id = ?`,
            [actualQty, item.id, sessionId]
          );
        }
      }

      // 1. Lấy các item có chênh lệch (actual_qty khác system_qty)
      const [items] = await conn.query(
        `SELECT * FROM audit_items WHERE session_id = ? AND actual_qty IS NOT NULL`,
        [sessionId]
      );

      for (const item of items) {
        const diff = item.actual_qty - item.system_qty;
        if (diff === 0) continue;

        // 2. Cập nhật batches
        await conn.query(
          `UPDATE batches SET quantity = ? WHERE id = ?`,
          [item.actual_qty, item.batch_id]
        );

        // 3. Ghi inventory_log
        await conn.query(
          `INSERT INTO inventory_logs
             (medicine_id, batch_id, change_amount, type, ref_id, ref_type, note)
           VALUES (?, ?, ?, 'ADJUST', ?, 'IMPORT_REQUEST', ?)`,
          [
            item.medicine_id,
            item.batch_id,
            diff,
            sessionId,
            `Kiểm kê phiên #${sessionId}`,
          ]
        );
      }

      // 4. Cập nhật trạng thái phiên
      await conn.query(
        `UPDATE audit_sessions SET status = 'CONFIRMED' WHERE id = ?`,
        [sessionId]
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

module.exports = Audit;
