const cron = require("node-cron");
const db = require("../config/db");
const { sendNearExpiryAlert, sendLowStockAlert } = require("../services/emailService");

// Chạy mỗi ngày lúc 8:00 sáng
cron.schedule("0 8 * * *", async () => {
  // ── Lấy danh sách email MANAGER (dùng chung cho cả 2 loại cảnh báo) ──
  let managers = [];
  try {
    const [rows] = await db.query(
      `SELECT email, name FROM users WHERE role = 'MANAGER' AND email IS NOT NULL`
    );
    managers = rows;
  } catch (err) {
    console.error("[ExpiryAlertJob] Lỗi lấy danh sách manager:", err.message);
    return;
  }

  if (managers.length === 0) {
    console.log("[ExpiryAlertJob] Không có manager nào để gửi email.");
    return;
  }

  // ══════════════════════════════════════════════
  // 1. CẢNH BÁO LÔ THUỐC CẬN DATE
  // ══════════════════════════════════════════════
  try {
    console.log("[ExpiryAlertJob] Đang kiểm tra lô thuốc cận date...");

    const [expiryItems] = await db.query(`
      SELECT
        m.name,
        b.batch_code,
        b.expiry_date,
        b.quantity,
        w.name AS warehouse_name
      FROM batches b
      JOIN medicines m ON m.id = b.medicine_id
      LEFT JOIN warehouses w ON w.id = b.warehouse_id
      WHERE b.expiry_date <= DATE_ADD(NOW(), INTERVAL 6 MONTH)
        AND b.quantity > 0
      ORDER BY b.expiry_date ASC
    `);

    if (expiryItems.length > 0) {
      for (const manager of managers) {
        try {
          await sendNearExpiryAlert(manager.email, expiryItems);
          console.log(`[ExpiryAlertJob] Gửi cảnh báo cận date → ${manager.email}`);
        } catch (emailErr) {
          console.error(`[ExpiryAlertJob] Lỗi gửi email cận date → ${manager.email}:`, emailErr.message);
        }
      }
      console.log(`[ExpiryAlertJob] Cận date: ${expiryItems.length} lô, gửi cho ${managers.length} manager.`);
    } else {
      console.log("[ExpiryAlertJob] Không có lô thuốc cận date.");
    }
  } catch (err) {
    console.error("[ExpiryAlertJob] Lỗi kiểm tra cận date:", err.message);
  }

  // ══════════════════════════════════════════════
  // 2. CẢNH BÁO TỒN KHO DƯỚI NGƯỠNG (min_stock)
  // ══════════════════════════════════════════════
  try {
    console.log("[ExpiryAlertJob] Đang kiểm tra tồn kho dưới ngưỡng...");

    const [lowStockItems] = await db.query(`
      SELECT
        m.id            AS medicine_id,
        m.name,
        COALESCE(SUM(b.quantity), 0)                      AS current_stock,
        m.min_stock,
        (m.min_stock - COALESCE(SUM(b.quantity), 0))      AS deficit
      FROM medicines m
      LEFT JOIN batches b ON b.medicine_id = m.id AND b.quantity > 0
      WHERE m.is_deleted = 0
        AND m.min_stock > 0
      GROUP BY m.id, m.name, m.min_stock
      HAVING current_stock <= m.min_stock
      ORDER BY deficit DESC
    `);

    if (lowStockItems.length > 0) {
      for (const manager of managers) {
        try {
          await sendLowStockAlert(manager.email, lowStockItems);
          console.log(`[ExpiryAlertJob] Gửi cảnh báo tồn kho thấp → ${manager.email}`);
        } catch (emailErr) {
          console.error(`[ExpiryAlertJob] Lỗi gửi email tồn kho thấp → ${manager.email}:`, emailErr.message);
        }
      }
      console.log(`[ExpiryAlertJob] Tồn kho thấp: ${lowStockItems.length} mặt hàng, gửi cho ${managers.length} manager.`);
    } else {
      console.log("[ExpiryAlertJob] Không có thuốc nào dưới ngưỡng tồn kho tối thiểu.");
    }
  } catch (err) {
    console.error("[ExpiryAlertJob] Lỗi kiểm tra tồn kho:", err.message);
  }
});

console.log("[ExpiryAlertJob] Đã đăng ký cron job (mỗi ngày 8:00 sáng).");
