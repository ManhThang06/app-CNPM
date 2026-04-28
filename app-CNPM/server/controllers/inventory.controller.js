const Inventory = require("../models/inventory.model");
const Medicine   = require("../models/medicine.model");

/**
 * GET /api/inventory/threshold-alerts
 * Trả về danh sách thuốc có tồn kho <= min_stock.
 */
exports.getThresholdAlerts = async (req, res) => {
  try {
    const alerts = await Inventory.getBelowThreshold();
    res.json(alerts);
  } catch (err) {
    console.error("[inventory.controller] getThresholdAlerts:", err.message);
    res.status(500).json({ message: err.message });
  }
};

/**
 * PUT /api/medicines/:id/min-stock
 * Cập nhật ngưỡng min_stock cho một loại thuốc (chỉ MANAGER).
 * Body: { min_stock: <number> }
 */
exports.updateMinStock = async (req, res) => {
  try {
    const id       = req.params.id;
    const minStock = parseInt(req.body.min_stock, 10);

    if (isNaN(minStock) || minStock < 0) {
      return res.status(400).json({ message: "min_stock phải là số nguyên >= 0" });
    }

    const existing = await Medicine.getById(id);
    if (!existing) {
      return res.status(404).json({ message: "Medicine not found" });
    }

    await Medicine.updateMinStock(id, minStock);

    res.json({
      message:    "Cập nhật ngưỡng tồn kho tối thiểu thành công",
      medicine_id: Number(id),
      min_stock:  minStock,
    });
  } catch (err) {
    console.error("[inventory.controller] updateMinStock:", err.message);
    res.status(500).json({ message: err.message });
  }
};
