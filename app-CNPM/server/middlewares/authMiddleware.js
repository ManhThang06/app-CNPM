const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

module.exports = function auth(req, res, next) {
  try {
    // 1. Check secret
    if (!JWT_SECRET) {
      throw new Error("JWT_SECRET is missing in .env");
    }

    // 2. Get Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ message: "No token provided" });
    }

    // 3. Check Bearer format
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Invalid token format" });
    }

    // 4. Extract token
    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Token missing" });
    }

    // 5. Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // 6. Attach user to request
    req.user = decoded;

    next();
  } catch (err) {
    // 7. Handle token errors
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }

    if (err.name === "JsonWebTokenError") {
      return res.status(403).json({ message: "Invalid token" });
    }

    return res.status(500).json({ message: err.message });
  }
};
