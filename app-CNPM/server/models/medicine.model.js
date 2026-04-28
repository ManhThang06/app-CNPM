const db = require("../config/db"); // mysql2 pool.promise()

const Medicine = {
  // GET ALL
  async getAll(status = "active") {
    let sql = "SELECT * FROM medicines";

    if (status === "active") {
      sql += " WHERE is_deleted = 0";
    } else if (status === "deleted") {
      sql += " WHERE is_deleted = 1";
    }

    sql += " ORDER BY created_at DESC";

    const [rows] = await db.query(sql);
    return rows;
  },

  // GET BY ID (dùng cho update/delete check tồn tại)
  async getById(id) {
    const [rows] = await db.query("SELECT * FROM medicines WHERE id = ?", [id]);
    return rows[0];
  },

  // CREATE
  async create(data) {
    const { name, description, image } = data;

    const [result] = await db.query(
      `INSERT INTO medicines (name, description, img_path)
       VALUES (?, ?, ?)`,
      [name, description, image],
    );

    return {
      id: result.insertId,
      name,
      description,
      image,
    };
  },

  // UPDATE
  async update(id, data) {
    let query = `UPDATE medicines SET name = ?, description = ?`;
    let params = [data.name, data.description];

    if (data.image !== undefined) {
      query += `, img_path = ?`;
      params.push(data.image);
    }

    query += ` WHERE id = ?`;
    params.push(id);

    await db.query(query, params);

    return {
      id,
      ...data,
    };
  },

  // DELETE
  async remove(id) {
    await db.query(
      `UPDATE medicines
      SET is_deleted = 1
      WHERE id = ?`,
      [id],
    );
  },

  async restore(id) {
    await db.query(`UPDATE medicines SET is_deleted = 0 WHERE id = ?`, [id]);
  },

  // UPDATE MIN_STOCK
  async updateMinStock(id, minStock) {
    await db.query(
      `UPDATE medicines SET min_stock = ? WHERE id = ?`,
      [minStock, id]
    );
  },
};

module.exports = Medicine;
