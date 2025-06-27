const Support = require('../models/support');

// Middleware: chỉ staff phụ trách hoặc customer tạo mới được thao tác
const canAccessSupport = async (req, res, next) => {
  try {
    const { supportId } = req.body;
    if (!supportId) {
      return res.status(400).json({ message: 'Vui lòng cung cấp supportId' });
    }

    const support = await Support.findByPk(supportId);
    if (!support) {
      return res.status(404).json({ message: 'Không tìm thấy support' });
    }

    const isOwner = support.accountIdCustomer === req.user.accountId;
    const isAssignedStaff = req.user.role === 'SF' && support.accountIdStaff === req.user.accountId;

    // Cho phép staff xem ticket chưa được gán
    const isStaffAndTicketIsUnassigned = req.user.role === 'SF' && support.accountIdStaff === null;

    if (isOwner || isAssignedStaff || isStaffAndTicketIsUnassigned) {
      req.support = support; // Gắn support vào request để controller dùng lại
      return next();
    }

    // Nếu không phải chủ sở hữu hoặc nhân viên phụ trách, từ chối truy cập
    return res.status(403).json({ message: 'Không có quyền truy cập support này' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { canAccessSupport }; 