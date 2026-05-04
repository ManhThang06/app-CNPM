const ImportRequest = require("../models/import_request.model");

// GET /api/import-requests
exports.getAll = async (req, res) => {
  try {
    const data = await ImportRequest.getAll();
    // Đối với storekeeper, có thể muốn lọc bỏ CANCELLED
    const filtered = data.filter(r => r.status !== 'CANCELLED');
    res.json(filtered);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/import-requests
exports.create = async (req, res) => {
  try {
    const { medicine_id, quantity, batch_code, expiry_date, note } = req.body;
    if (!medicine_id || !quantity) {
      return res.status(400).json({ message: "medicine_id và quantity là bắt buộc" });
    }
    const id = await ImportRequest.create({
      medicine_id,
      batch_code: batch_code || "",
      expiry_date: expiry_date || null,
      quantity,
      created_by: req.user.id,
      note,
    });
    res.status(201).json({ id, message: "Tạo yêu cầu nhập kho thành công" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/import-requests/:id/receive
exports.receive = async (req, res) => {
  try {
    const { batch_code, quantity, expiry_date, status, note, positions } = req.body;
    if (!quantity || !expiry_date || !positions || !positions.length) {
      return res.status(400).json({ message: "Thiếu thông tin lô hàng hoặc vị trí" });
    }
    const result = await ImportRequest.receive(req.params.id, {
      batch_code,
      total_quantity: quantity,
      expiry_date,
      status,
      note,
      positions,
    });
    res.json({ ...result, message: "Xác nhận nhận hàng thành công" });
  } catch (err) {
    const statusCode = err.status || 500;
    res.status(statusCode).json({ message: err.message });
  }
};

// PATCH /api/import-requests/:id/reject
exports.reject = async (req, res) => {
  try {
    const { note } = req.body;
    await ImportRequest.reject(req.params.id, note || "");
    res.json({ message: "Đã từ chối yêu cầu nhập kho" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/import-requests/:id/cancel
exports.cancel = async (req, res) => {
  try {
    await ImportRequest.cancel(req.params.id);
    res.json({ message: "Đã hủy yêu cầu nhập kho" });
  } catch (err) {
    const statusCode = err.status || 500;
    res.status(statusCode).json({ message: err.message });
  }
};
