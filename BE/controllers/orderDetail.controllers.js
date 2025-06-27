const { OrderDetail } = require('../models');

// Tạo mới orderDetail
const createOrderDetail = async (req, res) => {
  try {
    const { productId, classificationId, orderId, quantity } = req.body;
    const orderDetailId = 'OT' + Date.now();
    const newOrderDetail = await OrderDetail.create({
      orderDetailId,
      productId,
      classificationId,
      orderId,
      quantity
    });
    res.status(201).json(newOrderDetail);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy tất cả orderDetail
const getAllOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ message: 'Vui lòng cung cấp orderId!' });
    const orderDetails = await OrderDetail.findAll({ where: { orderId } });
    res.json(orderDetails);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy orderDetail theo id
const getOrderDetailById = async (req, res) => {
  try {
    const { id } = req.body;
    const orderDetail = await OrderDetail.findByPk(id);
    if (!orderDetail) return res.status(404).json({ message: 'Không tìm thấy chi tiết đơn hàng' });
    res.json(orderDetail);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Cập nhật orderDetail
const updateOrderDetail = async (req, res) => {
  try {
    const { id, comment, rate, imageEvaluate } = req.body;
    const [updated] = await OrderDetail.update(
      { comment, rate, imageEvaluate },
      { where: { orderDetailId: id } }
    );
    if (!updated) return res.status(404).json({ message: 'Không tìm thấy chi tiết đơn hàng' });
    const updatedOrderDetail = await OrderDetail.findByPk(id);
    res.json(updatedOrderDetail);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Xóa orderDetail
const deleteOrderDetail = async (req, res) => {
  try {
    const { id } = req.body;
    const deleted = await OrderDetail.destroy({ where: { orderDetailId: id } });
    if (!deleted) return res.status(404).json({ message: 'Không tìm thấy chi tiết đơn hàng' });
    res.json({ message: 'Xóa chi tiết đơn hàng thành công' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createOrderDetail,
  getAllOrderDetails,
  getOrderDetailById,
  updateOrderDetail,
  deleteOrderDetail
};
