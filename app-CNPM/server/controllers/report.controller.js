const Report = require("../models/report.model");

/** Validate date string YYYY-MM-DD */
function isValidDate(str) {
  return /^\d{4}-\d{2}-\d{2}$/.test(str) && !isNaN(Date.parse(str));
}

/** Validate year YYYY */
function isValidYear(str) {
  return /^\d{4}$/.test(str);
}

/**
 * GET /api/reports/revenue?from=YYYY-MM-DD&to=YYYY-MM-DD
 */
exports.getRevenue = async (req, res) => {
  try {
    const { from, to } = req.query;
    if (!isValidDate(from) || !isValidDate(to)) {
      return res.status(400).json({ message: "Thiếu hoặc sai định dạng tham số from/to (YYYY-MM-DD)" });
    }
    const data = await Report.getRevenue(from, to);
    res.json(data);
  } catch (err) {
    console.error("[report.controller] getRevenue:", err.message);
    res.status(500).json({ message: err.message });
  }
};

/**
 * GET /api/reports/profit?from=YYYY-MM-DD&to=YYYY-MM-DD
 */
exports.getProfit = async (req, res) => {
  try {
    const { from, to } = req.query;
    if (!isValidDate(from) || !isValidDate(to)) {
      return res.status(400).json({ message: "Thiếu hoặc sai định dạng tham số from/to (YYYY-MM-DD)" });
    }
    const data = await Report.getProfit(from, to);
    res.json(data);
  } catch (err) {
    console.error("[report.controller] getProfit:", err.message);
    res.status(500).json({ message: err.message });
  }
};

/**
 * GET /api/reports/revenue-by-medicine?from=YYYY-MM-DD&to=YYYY-MM-DD
 */
exports.getRevenueByMedicine = async (req, res) => {
  try {
    const { from, to } = req.query;
    if (!isValidDate(from) || !isValidDate(to)) {
      return res.status(400).json({ message: "Thiếu hoặc sai định dạng tham số from/to (YYYY-MM-DD)" });
    }
    const data = await Report.getRevenueByMedicine(from, to);
    res.json(data);
  } catch (err) {
    console.error("[report.controller] getRevenueByMedicine:", err.message);
    res.status(500).json({ message: err.message });
  }
};

/**
 * GET /api/reports/monthly-summary?year=YYYY
 */
exports.getMonthlySummary = async (req, res) => {
  try {
    const year = req.query.year || String(new Date().getFullYear());
    if (!isValidYear(year)) {
      return res.status(400).json({ message: "Thiếu hoặc sai định dạng tham số year (YYYY)" });
    }
    const data = await Report.getMonthlySummary(Number(year));
    res.json(data);
  } catch (err) {
    console.error("[report.controller] getMonthlySummary:", err.message);
    res.status(500).json({ message: err.message });
  }
};

/**
 * GET /api/reports/slow-moving?days=90&threshold=10
 */
exports.getSlowMoving = async (req, res) => {
  try {
    const days      = parseInt(req.query.days,      10) || 90;
    const threshold = parseInt(req.query.threshold, 10) || 10;

    if (days <= 0 || threshold < 0) {
      return res.status(400).json({ message: "days phải > 0, threshold phải >= 0" });
    }

    const data = await Report.getSlowMoving(days, threshold);
    res.json({
      params: { days, threshold },
      count:  data.length,
      items:  data,
    });
  } catch (err) {
    console.error("[report.controller] getSlowMoving:", err.message);
    res.status(500).json({ message: err.message });
  }
};

/**
 * GET /api/reports/fast-moving?days=30&top=10
 */
exports.getFastMoving = async (req, res) => {
  try {
    const days = parseInt(req.query.days, 10) || 30;
    const top  = parseInt(req.query.top,  10) || 10;

    if (days <= 0 || top <= 0) {
      return res.status(400).json({ message: "days và top phải > 0" });
    }

    const data = await Report.getFastMoving(days, top);
    res.json({
      params: { days, top },
      count:  data.length,
      items:  data,
    });
  } catch (err) {
    console.error("[report.controller] getFastMoving:", err.message);
    res.status(500).json({ message: err.message });
  }
};
