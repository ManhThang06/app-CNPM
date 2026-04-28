require("dotenv").config();
const mysql = require("mysql2/promise");

async function clearData() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "pharmacy_db",
  });

  const tables = [
    "inventory_logs",
    "export_request_items",
    "export_requests",
    "import_requests",
    "audit_items",
    "audit_sessions",
    "batches",
  ];

  console.log("Clearing data...");
  
  await connection.query("SET FOREIGN_KEY_CHECKS = 0");
  
  for (const table of tables) {
    try {
      await connection.query(`TRUNCATE TABLE \`${table}\``);
      console.log(`Truncated ${table}`);
    } catch (err) {
      console.error(`Failed to truncate ${table}:`, err.message);
    }
  }
  
  await connection.query("SET FOREIGN_KEY_CHECKS = 1");
  await connection.end();
  console.log("Database cleared successfully (except users, medicines, and warehouses).");
}

clearData().catch((err) => {
    console.error(err);
    process.exit(1);
});
