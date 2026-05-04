const db = require("../config/db");

function generateBatchCode(medicineId) {
  const now = new Date();
  const date = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("");
  const time = [
    String(now.getHours()).padStart(2, "0"),
    String(now.getMinutes()).padStart(2, "0"),
    String(now.getSeconds()).padStart(2, "0"),
  ].join("");
  const suffix = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `LO-${medicineId}-${date}-${time}-${suffix}`;
}

const ImportRequest = {
  // Lấy tất cả yêu cầu nhập kho
  async getAll() {
    const [rows] = await db.query(
      `SELECT ir.*, m.name AS medicine_name, u.name AS created_by_name
       FROM import_requests ir
       LEFT JOIN medicines m ON m.id = ir.medicine_id
       LEFT JOIN users u ON u.id = ir.created_by
       ORDER BY ir.id DESC`
    );
    return rows;
  },

  // Tạo yêu cầu nhập kho (manager)
  async create(data) {
    const { medicine_id, batch_code, expiry_date, quantity, created_by, note } = data;
    const finalBatchCode = batch_code?.trim() || generateBatchCode(medicine_id);
    const [result] = await db.query(
      `INSERT INTO import_requests (medicine_id, batch_code, expiry_date, quantity, status, created_by, note)
       VALUES (?, ?, ?, ?, 'PENDING', ?, ?)`,
      [medicine_id, finalBatchCode, expiry_date || null, quantity, created_by, note || ""]
    );
    return result.insertId;
  },

  // Xác nhận nhận hàng (storekeeper): INSERT batches + UPDATE status + ghi log
  async receive(id, receiveData) {
    const { batch_code, total_quantity, expiry_date, note, positions, status } = receiveData;
    // positions: [{ position, quantity }]
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // Lấy thông tin import request
      const [[req]] = await conn.query(
        `SELECT * FROM import_requests WHERE id = ?`,
        [id]
      );
      if (!req) throw { status: 404, message: "Không tìm thấy yêu cầu nhập" };
      
      const finalBatchCode =
        batch_code?.trim() || req.batch_code?.trim() || generateBatchCode(req.medicine_id);

      const batchIds = [];
      for (const pos of positions) {
        // INSERT batch mới cho từng vị trí
        const [batchResult] = await conn.query(
          `INSERT INTO batches (medicine_id, batch_code, quantity, import_date, expiry_date, position)
           VALUES (?, ?, ?, NOW(), ?, ?)`,
          [req.medicine_id, finalBatchCode, pos.quantity, expiry_date, pos.position]
        );
        batchIds.push(batchResult.insertId);
      }

      // UPDATE import_requests.status
      // Lưu vị trí đầu tiên vào bảng import_requests (để tương thích hoặc tham khảo nhanh)
      const primaryPosition = positions[0]?.position || "";
      await conn.query(
        `UPDATE import_requests
         SET status = 'RECEIVED',
             received_date = NOW(),
             batch_code = ?,
             expiry_date = ?,
             position = ?
         WHERE id = ?`,
        [finalBatchCode, expiry_date, primaryPosition, id]
      );

      // Ghi inventory_log cho từng batch
      for (let i = 0; i < positions.length; i++) {
        const pos = positions[i];
        const batchId = batchIds[i];
        await conn.query(
          `INSERT INTO inventory_logs
             (medicine_id, batch_id, change_amount, type, ref_id, ref_type, note)
           VALUES (?, ?, ?, 'IMPORT', ?, 'IMPORT_REQUEST', ?)`,
          [
            req.medicine_id,
            batchId,
            pos.quantity,
            id,
            (status === 'partial' ? '[Thiếu thuốc] ' : status === 'excess' ? '[Dư số lượng] ' : '') +
            (note || `Nhập kho theo yêu cầu #${id} tại ${pos.position}`),
          ]
        );
      }

      await conn.commit();
      return { batchIds, batchCode: finalBatchCode };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  // Từ chối yêu cầu nhập kho
  async reject(id, note) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [[req]] = await conn.query("SELECT * FROM import_requests WHERE id = ?", [id]);
      if (!req) throw { status: 404, message: "Không tìm thấy yêu cầu" };

      await conn.query(
        "UPDATE import_requests SET status = 'REJECTED', note = CONCAT(IFNULL(note, ''), ' | Từ chối: ', ?) WHERE id = ?",
        [note, id]
      );

      // Ghi log từ chối vào inventory_logs (change_amount = 0)
      await conn.query(
        `INSERT INTO inventory_logs (medicine_id, change_amount, type, ref_id, ref_type, note)
         VALUES (?, 0, 'IMPORT', ?, 'IMPORT_REQUEST', ?)`,
        [req.medicine_id, id, `Từ chối nhập kho yêu cầu #${id}: ${note}`]
      );

      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  // Hủy yêu cầu nhập kho (manager)
  async cancel(id) {
    const [[req]] = await db.query("SELECT * FROM import_requests WHERE id = ?", [id]);
    if (!req) throw { status: 404, message: "Không tìm thấy yêu cầu" };
    if (req.status !== "PENDING") throw { status: 400, message: "Chỉ có thể hủy yêu cầu đang chờ" };

    await db.query("UPDATE import_requests SET status = 'CANCELLED' WHERE id = ?", [id]);
  },
};

module.exports = ImportRequest;
