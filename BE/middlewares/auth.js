const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const { Account } = require("../models");

const logDbAccess = async (req, res, next) => {
  try {
    const user = req.user;
    if (user && (user.role === "SF" || user.role === "OS")) {
      const logEntry = `[${new Date().toISOString()}] ${user.accountId} (${
        user.role
      }) - ${req.method} ${req.originalUrl}\n`;
      const logPath = path.join(__dirname, "../logs/db_access.log");

      fs.appendFile(logPath, logEntry, (err) => {
        if (err) {
          console.error("Lỗi ghi log DB:", err.message);
        }
      });
    }
  } catch (err) {
    console.error("Lỗi middleware ghi log:", err.message);
  }

  next();
};

//  Middleware xác thực JWT và Status tài khoản phải ON
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token)
    return res.status(401).json({ message: "Không có token xác thực" });

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err)
      return res
        .status(403)
        .json({ message: "Token không hợp lệ hoặc hết hạn" });

    const account = await Account.findByPk(decoded.accountId);
    if (!account || account.status !== "ON") {
      return res
        .status(403)
        .json({ message: "Tài khoản không hợp lệ hoặc bị khóa" });
    }

    req.user = decoded;
    next();
  });
};

//  Middleware phân quyền theo role
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "Chưa xác thực" });

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Không có quyền truy cập" });
    }

    next();
  };
};

const validatePassword = (req, res, next) => {
  const password = req.body.password || req.body.newPassword;

  const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[^\s]{8,}$/;

  if (!password || !passwordRegex.test(password)) {
    return res.status(400).json({
      message:
        "Mật khẩu phải có ít nhất 8 ký tự, chứa ít nhất 1 chữ in hoa, 1 số và 1 ký tự đặc biệt.",
    });
  }

  next();
};

//  Export đúng cách
module.exports = {
  verifyToken,
  requireRole,
  logDbAccess,
  validatePassword,
};
