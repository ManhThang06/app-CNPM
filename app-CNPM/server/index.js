require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { runSetup } = require("./schema");

const auth = require("./middlewares/authMiddleware");

const authRoutes = require("./routes/auth.routes");
const medicineRoutes = require("./routes/medicines.routes");
const userRoutes = require("./routes/users.routes");
const auditRoutes = require("./routes/audits.routes");
const exportRequestRoutes = require("./routes/export_requests.routes");
const importRequestRoutes = require("./routes/import_requests.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const batchesRoutes = require("./routes/batches.routes");
const inventoryRoutes = require("./routes/inventory.routes");
const inventoryLogsRoutes = require("./routes/inventory_logs.routes");
const reportRoutes = require("./routes/reports.routes");

const app = express();

app.use(cors());
app.use(express.json());

// Public routes
app.use("/api/auth", authRoutes);
app.use("/uploads", express.static("assets/uploads"));

// Protected routes
app.use("/api/medicines", auth, medicineRoutes);
app.use("/api/users", auth, userRoutes);
app.use("/api/audits", auth, auditRoutes);
app.use("/api/export-requests", auth, exportRequestRoutes);
app.use("/api/import-requests", auth, importRequestRoutes);
app.use("/api/dashboard", auth, dashboardRoutes);
app.use("/api/batches", auth, batchesRoutes);
app.use("/api/inventory", auth, inventoryRoutes);
app.use("/api/inventory-logs", auth, inventoryLogsRoutes);
app.use("/api/reports", auth, reportRoutes);

require("./jobs/expiryAlertJob");

const PORT = process.env.PORT || 3000;

runSetup()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Server startup failed:", err.message);
    process.exit(1);
  });
