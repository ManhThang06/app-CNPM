const db = require("../config/db");

class User {
  static async findByUsername(username) {
    const [rows] = await db.query("SELECT * FROM users WHERE username = ?", [
      username,
    ]);
    return rows[0];
  }

  static async findById(id) {
    const [rows] = await db.query(
      "SELECT id, username, name, role FROM users WHERE id = ?",
      [id],
    );
    return rows[0];
  }

  static async create({ username, password, name, email }) {
    await db.query(
      "INSERT INTO users (username, password, name, email) VALUES (?, ?, ?, ?)",
      [username, password, name, email],
    );
  }
}

module.exports = User;
