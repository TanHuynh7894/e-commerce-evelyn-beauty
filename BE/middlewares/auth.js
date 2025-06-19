const jwt = require('jsonwebtoken');
const fs = require("fs");
const path = require("path");

const logDbAccess = async (req, res, next) => {
  try {
    if (req.user) {
      const logEntry = `[${new Date().toISOString()}] ${req.user.accountId} - ${req.method} ${req.originalUrl}\n`;

      const logPath = path.join(__dirname, "../logs/db_access.log");
      fs.appendFile(logPath, logEntry, (err) => {
        if (err) {
          console.error("Lỗi ghi log DB:", err.message);
        }
      });
    }
  } catch (err) {
    console.error("Lỗi ghi log DB:", err.message);
  }

  next(); // tiếp tục route xử lý
};

//  Middleware xác thực JWT
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Không có token xác thực' });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: 'Token không hợp lệ hoặc hết hạn' });

    req.user = decoded;
    next();
  });
};

//  Middleware phân quyền theo role
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Chưa xác thực' });

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Không có quyền truy cập' });
    }

    next();
  };
};

//  Export đúng cách
module.exports = {
  verifyToken,
  requireRole,
  logDbAccess
};
