const db = require("../config/db");

const ExportRequest = {
  // Lấy danh sách yêu cầu (storekeeper)
  async getAll() {
    const [rows] = await db.query(
      `SELECT er.*, u.name AS requester_name
       FROM export_requests er
       LEFT JOIN users u ON u.id = er.requester_id
       ORDER BY er.id DESC`
    );
    // Lấy items cho từng request
    for (const r of rows) {
      const [items] = await db.query(
        `SELECT eri.*, m.name AS medicine_name,
           (SELECT COALESCE(SUM(ABS(il.change_amount)), 0) 
            FROM inventory_logs il 
            WHERE il.ref_id = eri.export_request_id 
              AND il.ref_type = 'EXPORT_REQUEST' 
              AND il.medicine_id = eri.medicine_id) as exported_quantity
         FROM export_request_items eri
         JOIN medicines m ON m.id = eri.medicine_id
         WHERE eri.export_request_id = ?`,
        [r.id]
      );
      r.items = items;
    }
    return rows;
  },

  // Lấy các request của chính người dùng (requester)
  async getMyRequests(userId) {
    const [rows] = await db.query(
      `SELECT * FROM export_requests WHERE requester_id = ? ORDER BY id DESC`,
      [userId]
    );
    for (const r of rows) {
      const [items] = await db.query(
        `SELECT eri.*, m.name AS medicine_name,
           (SELECT COALESCE(SUM(ABS(il.change_amount)), 0) 
            FROM inventory_logs il 
            WHERE il.ref_id = eri.export_request_id 
              AND il.ref_type = 'EXPORT_REQUEST' 
              AND il.medicine_id = eri.medicine_id) as exported_quantity
         FROM export_request_items eri
         JOIN medicines m ON m.id = eri.medicine_id
         WHERE eri.export_request_id = ?`,
        [r.id]
      );
      r.items = items;
    }
    return rows;
  },

  // Tạo yêu cầu xuất kho
  async create(requesterId, items) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [result] = await conn.query(
        `INSERT INTO export_requests (requester_id, status) VALUES (?, 'PENDING')`,
        [requesterId]
      );
      const requestId = result.insertId;

      for (const item of items) {
        await conn.query(
          `INSERT INTO export_request_items (export_request_id, medicine_id, quantity)
           VALUES (?, ?, ?)`,
          [requestId, item.medicine_id, item.quantity]
        );
      }

      await conn.commit();
      return requestId;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  // Duyệt yêu cầu
  async approve(id) {
    await db.query(
      `UPDATE export_requests SET status = 'APPROVED' WHERE id = ?`,
      [id]
    );
  },

  // Từ chối yêu cầu
  async reject(id, note) {
    await db.query(
      `UPDATE export_requests SET status = 'REJECTED', feedback_note = ? WHERE id = ?`,
      [note, id]
    );
  },

  // Hoàn thành xuất kho: trừ batches + ghi log
  async complete(requestId, exportItems) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      let actualExportedItems = [];
      const exportedPerMed = {};

      for (const item of exportItems) {
        // Kiểm tra hạn sử dụng
        const [[batch]] = await conn.query(
          `SELECT b.id, b.batch_code, b.expiry_date, b.quantity, b.medicine_id, m.name as medicine_name 
           FROM batches b 
           JOIN medicines m ON m.id = b.medicine_id 
           WHERE b.id = ?`,
          [item.batch_id]
        );
        if (!batch) throw { status: 400, message: `Không tìm thấy lô #${item.batch_id}` };

        const now = new Date();
        if (new Date(batch.expiry_date) < now) {
          throw {
            status: 400,
            message: `Lô ${batch.batch_code} đã hết hạn, không thể xuất`,
          };
        }

        let exportQty = item.quantity;
        if (item.quantity > batch.quantity) {
          exportQty = batch.quantity;
        }

        if (exportQty > 0) {
          // Trừ số lượng
          await conn.query(
            `UPDATE batches SET quantity = quantity - ? WHERE id = ?`,
            [exportQty, item.batch_id]
          );

          // Ghi inventory_log
          await conn.query(
            `INSERT INTO inventory_logs
               (medicine_id, batch_id, change_amount, type, ref_id, ref_type, note)
             VALUES (?, ?, ?, 'EXPORT', ?, 'EXPORT_REQUEST', ?)`,
            [
              batch.medicine_id,
              item.batch_id,
              -exportQty,
              requestId,
              `Xuất kho theo yêu cầu #${requestId}`,
            ]
          );

          actualExportedItems.push({
            batchCode: batch.batch_code,
            quantity: exportQty
          });

          if (!exportedPerMed[batch.medicine_id]) {
            exportedPerMed[batch.medicine_id] = { name: batch.medicine_name, qty: 0 };
          }
          exportedPerMed[batch.medicine_id].qty += exportQty;
        }
      }

      // Lấy chi tiết yêu cầu gốc để so sánh
      const [reqItems] = await conn.query(
        `SELECT eri.medicine_id, m.name as medicine_name, eri.quantity as req_qty 
         FROM export_request_items eri
         JOIN medicines m ON m.id = eri.medicine_id
         WHERE eri.export_request_id = ?`,
        [requestId]
      );

      let shortages = [];
      for (const ri of reqItems) {
        const exported = exportedPerMed[ri.medicine_id]?.qty || 0;
        if (exported < ri.req_qty) {
           shortages.push({
             medicineName: ri.medicine_name,
             shortageAmount: ri.req_qty - exported,
             exportedAmount: exported,
             requestedAmount: ri.req_qty
           });
        }
      }

      // Xử lý thông tin thiếu
      let shortageNoteStr = null;
      let shortageInfo = [];
      if (shortages.length > 0) {
        const shortageNotes = [];
        for (const s of shortages) {
          shortageNotes.push(`${s.medicineName} - thiếu ${s.shortageAmount} (xuất ${s.exportedAmount}/${s.requestedAmount})`);
          shortageInfo.push({ medicineName: s.medicineName, shortageAmount: s.shortageAmount });
        }
        shortageNoteStr = `Thiếu: ${shortageNotes.join(", ")}`;
      }

      const finalStatus = shortages.length > 0 ? 'SHORTAGE' : 'COMPLETED';

      // Cập nhật status
      await conn.query(
        `UPDATE export_requests
         SET status = ?, storekeeper_confirm = 1, processed_date = NOW(), handle_result = 'SENT', shortage_note = ?
         WHERE id = ?`,
        [finalStatus, shortageNoteStr, requestId]
      );

      await conn.commit();

      return {
        exportedItems: actualExportedItems,
        shortageInfo: shortageInfo,
        hasShortage: shortages.length > 0
      };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },
};

module.exports = ExportRequest;
