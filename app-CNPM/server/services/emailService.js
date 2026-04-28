const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Gửi email reset password (giữ nguyên)
exports.sendResetEmail = async (to, token) => {
  const resetLink = `http://localhost:5173/reset-password?token=${token}`;

  const msg = {
    to,
    from: process.env.EMAIL_FROM,
    subject: "Reset Password",
    html: `
      <h3>Reset mật khẩu</h3>
      <p>Click vào link bên dưới:</p>
      <a href="${resetLink}">${resetLink}</a>
    `,
  };

  await sgMail.send(msg);
};

// Gửi email cảnh báo lô thuốc cận date
// items: [{name, batch_code, expiry_date, quantity, warehouse_name}]
exports.sendNearExpiryAlert = async (to, items) => {
  const dateStr = new Date().toLocaleDateString("vi-VN");

  const tableRows = items
    .map(
      (i) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">${i.name}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">${i.batch_code}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;color:#e53e3e;">
          ${new Date(i.expiry_date).toLocaleDateString("vi-VN")}
        </td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">${i.quantity}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">${i.warehouse_name || "—"}</td>
      </tr>`
    )
    .join("");

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:700px;margin:auto;">
      <div style="background:#1e40af;color:white;padding:20px 24px;border-radius:8px 8px 0 0;">
        <h2 style="margin:0;font-size:18px;">⚠️ Cảnh báo: Lô thuốc cận date</h2>
        <p style="margin:4px 0 0;font-size:13px;opacity:.85;">Ngày ${dateStr}</p>
      </div>
      <div style="padding:20px 24px;background:#f8fafc;border:1px solid #e2e8f0;border-top:none;">
        <p style="color:#475569;font-size:14px;">
          Các lô thuốc sau đây sẽ hết hạn trong vòng <strong>6 tháng tới</strong>. 
          Vui lòng kiểm tra và xử lý kịp thời.
        </p>
        <table style="width:100%;border-collapse:collapse;background:white;border-radius:6px;overflow:hidden;border:1px solid #e2e8f0;">
          <thead>
            <tr style="background:#f1f5f9;">
              <th style="padding:10px 12px;text-align:left;font-size:12px;color:#64748b;font-weight:600;">Tên thuốc</th>
              <th style="padding:10px 12px;text-align:left;font-size:12px;color:#64748b;font-weight:600;">Mã lô</th>
              <th style="padding:10px 12px;text-align:left;font-size:12px;color:#64748b;font-weight:600;">Hạn sử dụng</th>
              <th style="padding:10px 12px;text-align:left;font-size:12px;color:#64748b;font-weight:600;">Số lượng</th>
              <th style="padding:10px 12px;text-align:left;font-size:12px;color:#64748b;font-weight:600;">Kho</th>
            </tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>
        <p style="margin-top:16px;font-size:12px;color:#94a3b8;">
          Email này được gửi tự động từ hệ thống Pharm WMS lúc 8:00 sáng mỗi ngày.
        </p>
      </div>
    </div>
  `;

  const msg = {
    to,
    from: process.env.EMAIL_FROM,
    subject: `[Cảnh báo] Danh sách lô thuốc cận date - ${dateStr}`,
    html,
  };

  await sgMail.send(msg);
};

// Gửi email cảnh báo tồn kho dưới ngưỡng
// items: [{medicine_id, name, current_stock, min_stock, deficit}]
exports.sendLowStockAlert = async (to, items) => {
  const dateStr = new Date().toLocaleDateString("vi-VN");

  const tableRows = items
    .map(
      (i) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">${i.name}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:center;">${i.current_stock}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:center;">${i.min_stock}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:center;color:#e53e3e;font-weight:bold;">-${i.deficit}</td>
      </tr>`
    )
    .join("");

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:700px;margin:auto;">
      <div style="background:#b45309;color:white;padding:20px 24px;border-radius:8px 8px 0 0;">
        <h2 style="margin:0;font-size:18px;">📦 Cảnh báo: Tồn kho dưới ngưỡng tối thiểu</h2>
        <p style="margin:4px 0 0;font-size:13px;opacity:.85;">Ngày ${dateStr}</p>
      </div>
      <div style="padding:20px 24px;background:#fffbeb;border:1px solid #fde68a;border-top:none;">
        <p style="color:#78350f;font-size:14px;">
          Các mặt hàng sau đây có <strong>tồn kho thấp hơn ngưỡng tối thiểu</strong>.
          Vui lòng lên kế hoạch nhập hàng kịp thời.
        </p>
        <table style="width:100%;border-collapse:collapse;background:white;border-radius:6px;overflow:hidden;border:1px solid #e2e8f0;">
          <thead>
            <tr style="background:#fef3c7;">
              <th style="padding:10px 12px;text-align:left;font-size:12px;color:#92400e;font-weight:600;">Tên thuốc</th>
              <th style="padding:10px 12px;text-align:center;font-size:12px;color:#92400e;font-weight:600;">Tồn hiện tại</th>
              <th style="padding:10px 12px;text-align:center;font-size:12px;color:#92400e;font-weight:600;">Ngưỡng tối thiểu</th>
              <th style="padding:10px 12px;text-align:center;font-size:12px;color:#92400e;font-weight:600;">Thiếu (deficit)</th>
            </tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>
        <p style="margin-top:16px;font-size:12px;color:#94a3b8;">
          Email này được gửi tự động từ hệ thống Pharm WMS lúc 8:00 sáng mỗi ngày.
        </p>
      </div>
    </div>
  `;

  const msg = {
    to,
    from: process.env.EMAIL_FROM,
    subject: `[Cảnh báo] Tồn kho dưới ngưỡng - ${dateStr}`,
    html,
  };

  await sgMail.send(msg);
};
