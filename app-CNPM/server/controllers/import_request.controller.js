const ImportRequest = require("../models/import_request.model");

// GET /api/import-requests
exports.getAll = async (req, res) => {
  try {
    const data = await ImportRequest.getAll();
    res.json(data);
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
    const { batch_code, quantity, warehouse_id, expiry_date, status, note, position } = req.body;
    if (!batch_code || !quantity || !expiry_date) {
      return res.status(400).json({ message: "Thiếu thông tin lô hàng" });
    }
    const batchId = await ImportRequest.receive(req.params.id, {
      batch_code,
      quantity,
      warehouse_id: warehouse_id || 1,
      expiry_date,
      status,
      note,
      position,
    });
    res.json({ batchId, message: "Xác nhận nhận hàng thành công" });
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
