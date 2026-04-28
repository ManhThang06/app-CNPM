const Audit = require("../models/audit.model");

// GET /api/audits
exports.getAll = async (req, res) => {
  try {
    const sessions = await Audit.getAll();
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/audits/:id
exports.get = async (req, res) => {
  try {
    const data = await Audit.getById(req.params.id);
    if (!data) return res.status(404).json({ message: "Không tìm thấy phiên kiểm kê" });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/audits
exports.create = async (req, res) => {
  try {
    const createdBy = req.user.id;
    const sessionId = await Audit.create(createdBy);

    // Nếu có items trong body, thêm ngay
    const { items, confirm } = req.body;
    if (Array.isArray(items)) {
      for (const item of items) {
        await Audit.addItem(sessionId, item);
      }
    }

    if (confirm === true) {
      await Audit.confirm(sessionId);
    }

    res.status(201).json({ id: sessionId, message: "Tạo phiên kiểm kê thành công" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/audits/:id/items
exports.addItem = async (req, res) => {
  try {
    const { medicine_id, batch_id, system_qty, actual_qty } = req.body;
    const itemId = await Audit.addItem(req.params.id, { medicine_id, batch_id, system_qty, actual_qty });
    res.status(201).json({ id: itemId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/audits/:id/confirm
exports.confirm = async (req, res) => {
  try {
    await Audit.confirm(req.params.id, req.body.items);
    res.json({ message: "Xác nhận kiểm kê thành công" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
