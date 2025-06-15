const jwt = require('jsonwebtoken');

// ✅ Middleware xác thực JWT
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

// ✅ Middleware phân quyền theo role
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Chưa xác thực' });

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Không có quyền truy cập' });
    }

    next();
  };
};

// ✅ Export đúng cách
module.exports = {
  verifyToken,
  requireRole
};
