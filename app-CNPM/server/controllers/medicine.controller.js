const Medicine = require("../models/medicine.model");
const fs = require("fs");
const path = require("path");

// GET ALL
exports.getAll = async (req, res) => {
  try {
    const status = req.query.status || "active";

    const data = await Medicine.getAll(status);

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// CREATE
exports.create = async (req, res) => {
  try {
    const { name, description } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : "";

    if (!name || !description) {
      return res.status(400).json({
        message: "Name and description are required",
      });
    }

    const newMedicine = await Medicine.create({
      name,
      description,
      image,
    });

    res.status(201).json(newMedicine);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// UPDATE
exports.update = async (req, res) => {
  try {
    const id = req.params.id;

    const existing = await Medicine.getById(id);
    if (!existing) {
      return res.status(404).json({
        message: "Medicine not found",
      });
    }

    const { name, description } = req.body;

    if (!name || !description) {
      return res.status(400).json({
        message: "Name and description are required",
      });
    }

    const updateData = {
      name,
      description,
    };

    // 👉 nếu có upload ảnh mới
    if (req.file) {
      const newImage = `/uploads/${req.file.filename}`;
      updateData.image = newImage;

      // 🔥 XOÁ FILE CŨ
      if (existing.img_path) {
        const oldPath = path.join(
          __dirname,
          "..",
          "assets",
          existing.img_path.replace(/^\/+/, ""), // 👈 fix path
        );

        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
    }

    const updated = await Medicine.update(id, updateData);

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// DELETE
exports.remove = async (req, res) => {
  try {
    const id = req.params.id;

    const existing = await Medicine.getById(id);
    if (!existing) {
      return res.status(404).json({
        message: "Medicine not found",
      });
    }

    await Medicine.remove(id);
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.restore = async (req, res) => {
  try {
    const id = req.params.id;

    await Medicine.restore(id);

    res.json({ message: "Restored successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
