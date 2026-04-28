const db = require("../config/db");

const Report = {
  /**
   * Tổng doanh thu trong khoảng thời gian.
   * Dựa vào inventory_logs type = 'EXPORT', nhân change_amount * unit_price của medicines.
   * Trả về: total_revenue, total_quantity, transaction_count, labels, values (theo ngày)
   */
  async getRevenue(from, to) {
    const [rows] = await db.query(
      `
      SELECT
        DATE(il.created_at)                              AS day,
        SUM(ABS(il.change_amount) * m.unit_price)        AS daily_revenue,
        SUM(ABS(il.change_amount))                       AS daily_quantity,
        COUNT(*)                                         AS transaction_count
      FROM inventory_logs il
      JOIN medicines m ON m.id = il.medicine_id
      WHERE il.type = 'EXPORT'
        AND DATE(il.created_at) BETWEEN ? AND ?
      GROUP BY DATE(il.created_at)
      ORDER BY DATE(il.created_at) ASC
      `,
      [from, to]
    );

    const totalRevenue  = rows.reduce((s, r) => s + Number(r.daily_revenue), 0);
    const totalQuantity = rows.reduce((s, r) => s + Number(r.daily_quantity), 0);
    const totalTx       = rows.reduce((s, r) => s + Number(r.transaction_count), 0);

    return {
      total_revenue:      +totalRevenue.toFixed(2),
      total_quantity:     totalQuantity,
      transaction_count:  totalTx,
      labels: rows.map((r) => r.day),          // ["2024-01-01", ...]
      values: rows.map((r) => +Number(r.daily_revenue).toFixed(2)),
    };
  },

  /**
   * Lợi nhuận = doanh thu xuất - chi phí nhập
   * - Doanh thu: inventory_logs type=EXPORT × unit_price
   * - Chi phí nhập: inventory_logs type=IMPORT × import_price
   * Trả về: total_revenue, total_import_cost, total_profit, labels, revenue_values, cost_values, profit_values (theo ngày)
   */
  async getProfit(from, to) {
    const [rows] = await db.query(
      `
      SELECT
        DATE(il.created_at)                                                         AS day,
        SUM(CASE WHEN il.type = 'EXPORT' THEN ABS(il.change_amount) * m.unit_price  ELSE 0 END) AS daily_revenue,
        SUM(CASE WHEN il.type = 'IMPORT' THEN ABS(il.change_amount) * m.import_price ELSE 0 END) AS daily_cost
      FROM inventory_logs il
      JOIN medicines m ON m.id = il.medicine_id
      WHERE il.type IN ('EXPORT','IMPORT')
        AND DATE(il.created_at) BETWEEN ? AND ?
      GROUP BY DATE(il.created_at)
      ORDER BY DATE(il.created_at) ASC
      `,
      [from, to]
    );

    const totalRevenue = rows.reduce((s, r) => s + Number(r.daily_revenue), 0);
    const totalCost    = rows.reduce((s, r) => s + Number(r.daily_cost), 0);
    const totalProfit  = totalRevenue - totalCost;

    return {
      total_revenue:     +totalRevenue.toFixed(2),
      total_import_cost: +totalCost.toFixed(2),
      total_profit:      +totalProfit.toFixed(2),
      labels:            rows.map((r) => r.day),
      revenue_values:    rows.map((r) => +Number(r.daily_revenue).toFixed(2)),
      cost_values:       rows.map((r) => +Number(r.daily_cost).toFixed(2)),
      profit_values:     rows.map((r) => +(Number(r.daily_revenue) - Number(r.daily_cost)).toFixed(2)),
    };
  },

  /**
   * Doanh thu chi tiết theo từng loại thuốc trong khoảng thời gian.
   * Trả về: labels (tên thuốc), values (doanh thu), và mảng detail đầy đủ
   */
  async getRevenueByMedicine(from, to) {
    const [rows] = await db.query(
      `
      SELECT
        m.id                                              AS medicine_id,
        m.name,
        SUM(ABS(il.change_amount))                        AS total_quantity,
        m.unit_price,
        SUM(ABS(il.change_amount) * m.unit_price)         AS total_revenue
      FROM inventory_logs il
      JOIN medicines m ON m.id = il.medicine_id
      WHERE il.type = 'EXPORT'
        AND DATE(il.created_at) BETWEEN ? AND ?
      GROUP BY m.id, m.name, m.unit_price
      ORDER BY total_revenue DESC
      `,
      [from, to]
    );

    return {
      labels: rows.map((r) => r.name),
      values: rows.map((r) => +Number(r.total_revenue).toFixed(2)),
      detail: rows.map((r) => ({
        medicine_id:    r.medicine_id,
        name:           r.name,
        total_quantity: Number(r.total_quantity),
        unit_price:     +Number(r.unit_price).toFixed(2),
        total_revenue:  +Number(r.total_revenue).toFixed(2),
      })),
    };
  },

  /**
   * Tổng hợp theo tháng trong một năm.
   * Trả về 12 tháng (kể cả tháng = 0), gồm doanh thu, chi phí và lợi nhuận mỗi tháng.
   */
  async getMonthlySummary(year) {
    const [rows] = await db.query(
      `
      SELECT
        MONTH(il.created_at)                                                          AS month,
        SUM(CASE WHEN il.type = 'EXPORT' THEN ABS(il.change_amount) * m.unit_price   ELSE 0 END) AS monthly_revenue,
        SUM(CASE WHEN il.type = 'IMPORT' THEN ABS(il.change_amount) * m.import_price ELSE 0 END) AS monthly_cost
      FROM inventory_logs il
      JOIN medicines m ON m.id = il.medicine_id
      WHERE il.type IN ('EXPORT','IMPORT')
        AND YEAR(il.created_at) = ?
      GROUP BY MONTH(il.created_at)
      ORDER BY MONTH(il.created_at) ASC
      `,
      [year]
    );

    // Đảm bảo 12 tháng luôn có mặt (tháng chưa có data = 0)
    const monthMap = {};
    for (const r of rows) {
      monthMap[r.month] = r;
    }

    const labels         = [];
    const revenue_values = [];
    const cost_values    = [];
    const profit_values  = [];

    for (let m = 1; m <= 12; m++) {
      const rev  = monthMap[m] ? Number(monthMap[m].monthly_revenue) : 0;
      const cost = monthMap[m] ? Number(monthMap[m].monthly_cost)    : 0;
      labels.push(`Tháng ${m}`);
      revenue_values.push(+rev.toFixed(2));
      cost_values.push(+cost.toFixed(2));
      profit_values.push(+(rev - cost).toFixed(2));
    }

    const totalRevenue = revenue_values.reduce((s, v) => s + v, 0);
    const totalCost    = cost_values.reduce((s, v) => s + v, 0);

    return {
      year,
      total_revenue:     +totalRevenue.toFixed(2),
      total_import_cost: +totalCost.toFixed(2),
      total_profit:      +(totalRevenue - totalCost).toFixed(2),
      labels,
      revenue_values,
      cost_values,
      profit_values,
    };
  },

  /**
   * Phân tích hàng chậm luân chuyển (slow-moving inventory).
   * @param {number} days     - Số ngày nhìn lại (default 90)
   * @param {number} threshold - Ngưỡng số lượng xuất để bị coi là chậm (default 10)
   * Trả về tất cả thuốc còn tồn kho > 0, kèm status: 'slow' | 'no_movement'
   */
  async getSlowMoving(days = 90, threshold = 10) {
    const [rows] = await db.query(
      `
      SELECT
        m.id                                                  AS medicine_id,
        m.name,
        COALESCE(SUM(b.quantity), 0)                          AS current_stock,
        COALESCE(ABS(SUM(
          CASE
            WHEN il.type = 'EXPORT'
             AND il.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
            THEN il.change_amount
            ELSE 0
          END
        )), 0)                                                AS exported_last_N_days
      FROM medicines m
      LEFT JOIN batches b        ON b.medicine_id = m.id AND b.quantity > 0
      LEFT JOIN inventory_logs il ON il.medicine_id = m.id
      WHERE m.is_deleted = 0
      GROUP BY m.id, m.name
      HAVING current_stock > 0
        AND exported_last_N_days < ?
      ORDER BY exported_last_N_days ASC, current_stock DESC
      `,
      [days, threshold]
    );

    return rows.map((r) => {
      const currentStock      = Number(r.current_stock);
      const exportedLastNDays = Number(r.exported_last_N_days);
      const avgDailyExport    = +(exportedLastNDays / days).toFixed(4);
      const daysOfStockRemaining =
        avgDailyExport > 0
          ? Math.round(currentStock / avgDailyExport)
          : null;

      return {
        medicine_id:            r.medicine_id,
        name:                   r.name,
        current_stock:          currentStock,
        exported_last_N_days:   exportedLastNDays,
        avg_daily_export:       avgDailyExport,
        days_of_stock_remaining: daysOfStockRemaining,
        status:                 exportedLastNDays === 0 ? "no_movement" : "slow",
      };
    });
  },

  /**
   * Top N thuốc bán chạy nhất trong N ngày gần nhất.
   * @param {number} days - Số ngày nhìn lại (default 30)
   * @param {number} top  - Số lượng thuốc trả về (default 10)
   */
  async getFastMoving(days = 30, top = 10) {
    const [rows] = await db.query(
      `
      SELECT
        m.id                                          AS medicine_id,
        m.name,
        COALESCE(SUM(b.quantity), 0)                  AS current_stock,
        ABS(SUM(
          CASE WHEN il.type = 'EXPORT' THEN il.change_amount ELSE 0 END
        ))                                            AS exported_last_N_days
      FROM medicines m
      LEFT JOIN batches b        ON b.medicine_id = m.id AND b.quantity > 0
      JOIN  inventory_logs il    ON il.medicine_id = m.id
        AND il.type = 'EXPORT'
        AND il.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      WHERE m.is_deleted = 0
      GROUP BY m.id, m.name
      ORDER BY exported_last_N_days DESC
      LIMIT ?
      `,
      [days, top]
    );

    return rows.map((r) => {
      const currentStock      = Number(r.current_stock);
      const exportedLastNDays = Number(r.exported_last_N_days);
      const avgDailyExport    = +(exportedLastNDays / days).toFixed(4);
      const daysOfStockRemaining =
        avgDailyExport > 0
          ? Math.round(currentStock / avgDailyExport)
          : null;

      return {
        medicine_id:             r.medicine_id,
        name:                    r.name,
        current_stock:           currentStock,
        exported_last_N_days:    exportedLastNDays,
        avg_daily_export:        avgDailyExport,
        days_of_stock_remaining: daysOfStockRemaining,
        status:                  "fast",
      };
    });
  },
};

module.exports = Report;
