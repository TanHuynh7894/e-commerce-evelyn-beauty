const Support = require('../models/support');
const { Op } = require('sequelize');

// Tạo yêu cầu hỗ trợ (customer gửi)
const createSupport = async (req, res) => {
  try {
    const { comment } = req.body;
    const support = await Support.create({
      supportId: `SP${Date.now()}`,
      accountIdCustomer: req.user.accountId,
      dateCreate: new Date(),
      comment
    });
    res.status(201).json(support);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Lấy tất cả support (staff xem ticket của mình và chưa có người nhận, customer xem ticket của mình)
const getAllSupports = async (req, res) => {
  try {
    let supports;
    if (req.user.role === 'SF') {
      // Staff xem ticket của mình hoặc chưa ai nhận
      supports = await Support.findAll({
        where: {
          [Op.or]: [
            { accountIdStaff: req.user.accountId },
            { accountIdStaff: null }
          ]
        }
      });
    } else {
      // Customer chỉ xem được ticket của mình
      supports = await Support.findAll({
        where: {
          accountIdCustomer: req.user.accountId
        }
      });
    }
    res.json(supports);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Lấy support theo id (chỉ staff hoặc customer liên quan mới xem được)
const getSupportById = async (req, res) => {
  res.json(req.support);
};

// Staff cập nhật xử lý support
const resolveSupport = async (req, res) => {
  try {
    const { supportId, resolve } = req.body;
    if (!supportId) {
      return res.status(400).json({ message: 'Vui lòng cung cấp supportId' });
    }

    const support = await Support.findByPk(supportId);
    if (!support) return res.status(404).json({ message: 'Không tìm thấy support' });

    // Chỉ staff mới có quyền xử lý
    if (req.user.role !== 'SF') {
      return res.status(403).json({ message: 'Không có quyền xử lý' });
    }

    // Nếu ticket đã có người xử lý nhưng không phải mình, báo lỗi
    if (support.accountIdStaff && support.accountIdStaff !== req.user.accountId) {
      return res.status(403).json({ message: 'Bạn không có quyền xử lý support này' });
    }

    // Gán ticket cho staff nếu chưa có ai nhận
    if (!support.accountIdStaff) {
      support.accountIdStaff = req.user.accountId;
    }

    support.resolve = resolve;
    support.dateResolve = new Date();
    await support.save();
    res.json(support);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Xóa support (chỉ customer tạo mới xóa được khi chưa xử lý)
const deleteSupport = async (req, res) => {
  try {
    const { supportId } = req.body;
    if (!supportId) {
      return res.status(400).json({ message: 'Vui lòng cung cấp supportId' });
    }
    const support = await Support.findByPk(supportId);
    if (!support) return res.status(404).json({ message: 'Không tìm thấy support' });
    if (
      support.accountIdCustomer !== req.user.accountId ||
      support.resolve
    ) {
      return res.status(403).json({ message: 'Không có quyền xóa hoặc support đã được xử lý' });
    }
    await support.destroy();
    res.json({ message: 'Đã xóa support' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createSupport,
  getAllSupports,
  getSupportById,
  resolveSupport,
  deleteSupport
};