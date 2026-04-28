require("dotenv").config();

const mysql = require("mysql2/promise");
const db = require("./config/db");

const databaseName = process.env.DB_NAME || "pharmacy_db";

const baseTables = [
  {
    label: "CREATE users",
    sql: `CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(50) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      name VARCHAR(100) NOT NULL,
      phone VARCHAR(20),
      email VARCHAR(100) NOT NULL UNIQUE,
      role ENUM('REQUESTER','STOREKEEPER','MANAGER') NOT NULL,
      address VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  },
  {
    label: "CREATE medicines",
    sql: `CREATE TABLE IF NOT EXISTS medicines (
      id INT AUTO_INCREMENT PRIMARY KEY,
      img_path VARCHAR(255),
      name VARCHAR(150) NOT NULL,
      description TEXT,
      min_stock INT DEFAULT 0,
      max_stock INT DEFAULT 0,
      near_expiry_days INT DEFAULT 180,
      unit_price DECIMAL(12,2) DEFAULT 0,
      import_price DECIMAL(12,2) DEFAULT 0,
      is_deleted BOOLEAN DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  },
  {
    label: "CREATE batches",
    sql: `CREATE TABLE IF NOT EXISTS batches (
      id INT AUTO_INCREMENT PRIMARY KEY,
      medicine_id INT NOT NULL,
      batch_code VARCHAR(100) NOT NULL,
      quantity INT NOT NULL,
      import_date DATE,
      expiry_date DATE,
      position VARCHAR(50),
      cabinet_is_full TINYINT(1) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (medicine_id) REFERENCES medicines(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  },
  {
    label: "CREATE import_requests",
    sql: `CREATE TABLE IF NOT EXISTS import_requests (
      id INT AUTO_INCREMENT PRIMARY KEY,
      medicine_id INT NOT NULL,
      batch_code VARCHAR(100),
      quantity INT NOT NULL,
      status ENUM('PENDING','RECEIVED','REJECTED') DEFAULT 'PENDING',
      received_date DATE,
      expiry_date DATE,
      created_by INT,
      note TEXT,
      position VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (medicine_id) REFERENCES medicines(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  },
  {
    label: "CREATE export_requests",
    sql: `CREATE TABLE IF NOT EXISTS export_requests (
      id INT AUTO_INCREMENT PRIMARY KEY,
      requester_id INT NOT NULL,
      status ENUM('PENDING','APPROVED','REJECTED','COMPLETED','FAILED','SHORTAGE') DEFAULT 'PENDING',
      shortage_note TEXT,
      storekeeper_confirm BOOLEAN DEFAULT NULL,
      requester_confirm BOOLEAN DEFAULT NULL,
      handle_result ENUM('SENT','OUT_OF_STOCK'),
      feedback_note TEXT,
      processed_date TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (requester_id) REFERENCES users(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  },
  {
    label: "CREATE export_request_items",
    sql: `CREATE TABLE IF NOT EXISTS export_request_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      export_request_id INT NOT NULL,
      medicine_id INT NOT NULL,
      quantity INT NOT NULL,
      FOREIGN KEY (export_request_id) REFERENCES export_requests(id),
      FOREIGN KEY (medicine_id) REFERENCES medicines(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  },
  {
    label: "CREATE inventory_logs",
    sql: `CREATE TABLE IF NOT EXISTS inventory_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      medicine_id INT,
      batch_id INT,
      change_amount INT NOT NULL,
      type ENUM('IMPORT','EXPORT','ADJUST') NOT NULL,
      ref_id INT,
      ref_type ENUM('IMPORT_REQUEST','EXPORT_REQUEST'),
      note TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (medicine_id) REFERENCES medicines(id),
      FOREIGN KEY (batch_id) REFERENCES batches(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  },
];

const seedStatements = [
  {
    label: "SEED users",
    sql: `INSERT INTO users (id, username, password, name, email, role)
      VALUES
        (1, 'manager', '$2b$10$2Bj.HDGwWK7hxmXs1iSZke9sEdLH5Sn7d.bqc4EWVIhGi3mxbJkFW', 'Manager One', 'manager@gmail.com', 'MANAGER'),
        (2, 'request', '$2b$10$2Bj.HDGwWK7hxmXs1iSZke9sEdLH5Sn7d.bqc4EWVIhGi3mxbJkFW', 'Requester One', 'request@gmail.com', 'REQUESTER'),
        (3, 'store', '$2b$10$2Bj.HDGwWK7hxmXs1iSZke9sEdLH5Sn7d.bqc4EWVIhGi3mxbJkFW', 'Store Keeper One', 'store@gmail.com', 'STOREKEEPER')`,
  },
  {
    label: "SEED medicines",
    sql: `INSERT INTO medicines (id, name, description, img_path)
      VALUES
        (1, 'Panadol 500mg', 'Pain relief and fever reducer', '/uploads/panadol_500mg.webp'),
        (2, 'Amoxicillin 500mg', 'Antibiotic for bacterial infection', '/uploads/amoxicillin_500mg.png'),
        (3, 'Ibuprofen 200mg', 'Anti-inflammatory pain relief', '/uploads/ibuprofen_200mg.jpg'),
        (4, 'Vitamin C 1000mg', 'Immune support supplement', '/uploads/VitaminC_1000mg.webp'),
        (5, 'Omeprazole 20mg', 'Stomach acid treatment', '/uploads/omeprazol_200mg.jpg')`,
  },
];

const schemaMigrations = [
  {
    label: "CREATE audit_sessions",
    sql: `CREATE TABLE IF NOT EXISTS audit_sessions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      created_by INT,
      status ENUM('OPEN','CONFIRMED') DEFAULT 'OPEN',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id)
    )`,
  },
  {
    label: "CREATE audit_items",
    sql: `CREATE TABLE IF NOT EXISTS audit_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      session_id INT NOT NULL,
      medicine_id INT NOT NULL,
      batch_id INT NOT NULL,
      system_qty INT NOT NULL,
      actual_qty INT,
      FOREIGN KEY (session_id) REFERENCES audit_sessions(id),
      FOREIGN KEY (medicine_id) REFERENCES medicines(id),
      FOREIGN KEY (batch_id) REFERENCES batches(id)
    )`,
  },
  {
    label: "ADD batches.position",
    sql: "ALTER TABLE batches ADD COLUMN position VARCHAR(50)",
  },
  {
    label: "ADD batches.cabinet_is_full",
    sql: "ALTER TABLE batches ADD COLUMN cabinet_is_full TINYINT(1) DEFAULT 0",
  },
  {
    label: "ADD medicines.min_stock",
    sql: "ALTER TABLE medicines ADD COLUMN min_stock INT DEFAULT 0",
  },
  {
    label: "ADD medicines.max_stock",
    sql: "ALTER TABLE medicines ADD COLUMN max_stock INT DEFAULT 0",
  },
  {
    label: "ADD medicines.near_expiry_days",
    sql: "ALTER TABLE medicines ADD COLUMN near_expiry_days INT DEFAULT 180",
  },
  {
    label: "ADD medicines.unit_price",
    sql: "ALTER TABLE medicines ADD COLUMN unit_price DECIMAL(12,2) DEFAULT 0",
  },
  {
    label: "ADD medicines.import_price",
    sql: "ALTER TABLE medicines ADD COLUMN import_price DECIMAL(12,2) DEFAULT 0",
  },
  {
    label: "ADD import_requests.created_by",
    sql: "ALTER TABLE import_requests ADD COLUMN created_by INT",
  },
  {
    label: "ADD import_requests.note",
    sql: "ALTER TABLE import_requests ADD COLUMN note TEXT",
  },
  {
    label: "ADD import_requests.expiry_date",
    sql: "ALTER TABLE import_requests ADD COLUMN expiry_date DATE",
  },
  {
    label: "ADD import_requests.position",
    sql: "ALTER TABLE import_requests ADD COLUMN position VARCHAR(50)",
  },
  {
    label: "UPDATE import_requests.status enum",
    sql: "ALTER TABLE import_requests MODIFY COLUMN status ENUM('PENDING','RECEIVED','REJECTED') DEFAULT 'PENDING'",
  },
  {
    label: "ADD import_requests.created_by foreign key",
    run: ensureImportRequestsCreatedByForeignKey,
  },
  {
    label: "UPDATE export_requests.status enum",
    sql: "ALTER TABLE export_requests MODIFY COLUMN status ENUM('PENDING','APPROVED','REJECTED','COMPLETED','FAILED','SHORTAGE') DEFAULT 'PENDING'",
  },
  {
    label: "ADD export_requests.shortage_note",
    sql: "ALTER TABLE export_requests ADD COLUMN shortage_note TEXT",
  },
];

function isIgnorableSchemaError(err) {
  if (!err) return false;

  return (
    err.code === "ER_DUP_FIELDNAME" ||
    err.code === "ER_TABLE_EXISTS_ERROR" ||
    err.code === "ER_DUP_KEYNAME" ||
    err.code === "ER_DUP_KEY" ||
    err.message.includes("Duplicate column") ||
    err.message.includes("Duplicate key") ||
    err.message.includes("already exists")
  );
}

async function runMigrations(connection = db) {
  for (const migration of schemaMigrations) {
    const { label, sql, run } = migration;

    try {
      if (run) {
        await run(connection);
      } else {
        await connection.query(sql);
      }

      console.log(`Migration OK: ${label}`);
    } catch (err) {
      if (!isIgnorableSchemaError(err)) {
        console.error(`Migration failed [${label}]:`, err.message);
      }
    }
  }
}

async function ensureImportRequestsCreatedByForeignKey(connection) {
  const [constraints] = await connection.query(
    `SELECT CONSTRAINT_NAME
     FROM information_schema.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA = ?
       AND TABLE_NAME = 'import_requests'
       AND COLUMN_NAME = 'created_by'
       AND REFERENCED_TABLE_NAME = 'users'
       AND REFERENCED_COLUMN_NAME = 'id'`,
    [databaseName],
  );

  if (constraints.length > 0) {
    return;
  }

  await connection.query(
    `ALTER TABLE import_requests
     ADD CONSTRAINT fk_import_requests_created_by
     FOREIGN KEY (created_by) REFERENCES users(id)`,
  );
}

async function runStatements(connection, statements, successPrefix) {
  for (const { label, sql } of statements) {
    try {
      await connection.query(sql);
      console.log(`${successPrefix}: ${label}`);
    } catch (err) {
      if (!isIgnorableSchemaError(err)) {
        console.error(`${successPrefix} failed [${label}]:`, err.message);
      }
    }
  }
}

async function createDatabaseIfMissing() {
  if (!/^[a-zA-Z0-9_]+$/.test(databaseName)) {
    throw new Error("Invalid database name");
  }

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
  });

  try {
    await conn.query(
      `CREATE DATABASE IF NOT EXISTS \`${databaseName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    );
    console.log(`Database OK: ${databaseName}`);
  } finally {
    await conn.end();
  }
}

async function runSetup() {
  await createDatabaseIfMissing();

  const conn = await createSchemaConnection();

  try {
    await runStatements(conn, baseTables, "Table OK");
    await runMigrations(conn);
    await seedInitialData(conn);
  } finally {
    await conn.end();
  }
}

async function hasExistingSeedData(connection) {
  const tables = [
    "users",
    "medicines",
    "batches",
    "import_requests",
    "export_requests",
    "export_request_items",
    "inventory_logs",
  ];

  for (const table of tables) {
    const [[row]] = await connection.query(
      `SELECT COUNT(*) AS row_count FROM \`${table}\``,
    );

    if (Number(row.row_count) > 0) {
      return true;
    }
  }

  return false;
}

async function seedInitialData(connection) {
  if (await hasExistingSeedData(connection)) {
    console.log("Seed skipped: existing data found");
    return;
  }

  await runStatements(connection, seedStatements, "Seed OK");
}

async function createSchemaConnection() {
  return mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: databaseName,
    multipleStatements: true,
  });
}

async function listTables() {
  const conn = await createSchemaConnection();

  try {
    const [tables] = await conn.query("SHOW TABLES");
    console.log(tables.map((table) => Object.values(table)[0]));
  } finally {
    await conn.end();
  }
}

async function showCreateTable(tableName) {
  if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
    throw new Error("Invalid table name");
  }

  const conn = await createSchemaConnection();

  try {
    const [rows] = await conn.query(`SHOW CREATE TABLE \`${tableName}\``);
    console.log(rows[0]["Create Table"]);
  } finally {
    await conn.end();
  }
}

async function main() {
  const command = process.argv[2] || "migrate";
  const arg = process.argv[3];

  if (command === "migrate") {
    await runMigrations();
    return;
  }

  if (command === "setup") {
    await runSetup();
    return;
  }

  if (command === "seed") {
    const conn = await createSchemaConnection();

    try {
      await seedInitialData(conn);
    } finally {
      await conn.end();
    }

    return;
  }

  if (command === "tables") {
    await listTables();
    return;
  }

  if (command === "show-create") {
    if (!arg) {
      throw new Error("Usage: node schema.js show-create <table_name>");
    }

    await showCreateTable(arg);
    return;
  }

  throw new Error(
    "Usage: node schema.js [setup|migrate|seed|tables|show-create <table_name>]",
  );
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err.message);
      process.exit(1);
    });
}

module.exports = {
  baseTables,
  runMigrations,
  runSetup,
  seedInitialData,
  schemaMigrations,
  seedStatements,
};
