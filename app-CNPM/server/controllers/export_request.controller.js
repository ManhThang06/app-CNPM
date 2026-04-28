const ExportRequest = require("../models/export_request.model");

// GET /api/export-requests  (storekeeper xem tất cả)
exports.getAll = async (req, res) => {
  try {
    const data = await ExportRequest.getAll();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/export-requests/my  (requester xem của mình)
exports.getMy = async (req, res) => {
  try {
    const data = await ExportRequest.getMyRequests(req.user.id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/export-requests
exports.create = async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Danh sách thuốc không được rỗng" });
    }
    const id = await ExportRequest.create(req.user.id, items);
    res.status(201).json({ id, message: "Tạo yêu cầu xuất kho thành công" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/export-requests/:id/approve
exports.approve = async (req, res) => {
  try {
    await ExportRequest.approve(req.params.id);
    res.json({ message: "Đã duyệt yêu cầu" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/export-requests/:id/reject
exports.reject = async (req, res) => {
  try {
    const { note } = req.body;
    await ExportRequest.reject(req.params.id, note || "");
    res.json({ message: "Đã từ chối yêu cầu" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/export-requests/:id/complete
exports.complete = async (req, res) => {
  try {
    const { exportItems } = req.body;
    if (!Array.isArray(exportItems) || exportItems.length === 0) {
      return res.status(400).json({ message: "Danh sách lô xuất không được rỗng" });
    }
    const result = await ExportRequest.complete(req.params.id, exportItems);
    res.json({ message: "Xuất kho thành công", ...result });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ message: err.message });
  }
};
