const express = require('express');
const router = express.Router();
const {
  createSupport,
  getAllSupports,
  getSupportById,
  resolveSupport,
  deleteSupport
} = require('../controllers/supports.controllers');
const { verifyToken, requireRole } = require('../middlewares/auth');
const { canAccessSupport } = require('../middlewares/support.middlewares');

// Tất cả route đều cần xác thực
router.use(verifyToken);

// Customer tạo support
router.post('/', createSupport);

// Lấy tất cả support của mình (chỉ staff)
router.get('/', requireRole('SF'), getAllSupports);

// Lấy support theo id (chỉ staff phụ trách hoặc customer tạo mới xem được)
router.get('/:id', canAccessSupport, getSupportById);

// Staff xử lý support (chỉ staff phụ trách)
router.put('/:id/resolve', requireRole('SF'), canAccessSupport, resolveSupport);

// Customer xóa support của mình khi chưa xử lý
router.delete('/:id', canAccessSupport, deleteSupport);

module.exports = router; 