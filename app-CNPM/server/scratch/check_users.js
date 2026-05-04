require('dotenv').config();
const db = require('../config/db');
async function check() {
  try {
    const [rows] = await db.query('SELECT username, role FROM users');
    console.log(JSON.stringify(rows));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}
check();
