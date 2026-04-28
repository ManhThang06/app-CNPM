const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/user.model");

const JWT_SECRET = process.env.JWT_SECRET;

// REGISTER
exports.register = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const username = email.split("@")[0];

    const existingUser = await User.findByUsername(username);

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      username,
      password: hashedPassword,
      name,
      email,
    });

    res.json({ message: "Register success" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// LOGIN
exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findByUsername(username);

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Wrong password" });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({
      message: "Login success",
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const [users] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    if (users.length === 0) {
      return res.status(400).json({ message: "Email not found" });
    }

    const user = users[0];

    const token = crypto.randomBytes(32).toString("hex");

    const expireTime = new Date(Date.now() + 15 * 60 * 1000); // 15 phút

    await db.query(
      "UPDATE users SET reset_token = ?, reset_token_exp = ? WHERE id = ?",
      [token, expireTime, user.id],
    );

    res.json({
      message: "Reset token created",
      resetToken: token, // (dev only, production phải gửi email)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.logout = async (req, res) => {};

exports.resetPassword = async (req, res) => {};
