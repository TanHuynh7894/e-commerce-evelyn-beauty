const Support = require('../models/support');
const { Op } = require('sequelize');

// Tạo yêu cầu hỗ trợ (customer gửi)
const createSupport = async (req, res) => {
  try {
    const { accountIdStaff, comment } = req.body;
    const support = await Support.create({
      supportId: `SP${Date.now()}`,
      accountIdCustomer: req.user.accountId,
      accountIdStaff,
      dateCreate: new Date(),
      comment
    });
    res.status(201).json(support);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Lấy tất cả support (chỉ staff lấy của mình)
const getAllSupports = async (req, res) => {
  try {
    const supports = await Support.findAll({
      where: {
        accountIdStaff: req.user.accountId
      }
    });
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
    const support = await Support.findByPk(req.params.id);
    if (!support) return res.status(404).json({ message: 'Không tìm thấy support' });
    if (req.user.role !== 'SF' || support.accountIdStaff !== req.user.accountId) {
      return res.status(403).json({ message: 'Không có quyền xử lý' });
    }
    support.resolve = req.body.resolve;
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
    const support = await Support.findByPk(req.params.id);
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
