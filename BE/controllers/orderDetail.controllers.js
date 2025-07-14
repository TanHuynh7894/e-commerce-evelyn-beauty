const { OrderDetail } = require("../models");
// Hàm internal (dùng ở đâu cũng được)
// Controller dùng cho API, gọi lại hàm internal
// const { createOrderDetailInternal } = require('./orderDetail.controllers'); // Nếu tách file, còn cùng file thì không cần import
// Hàm tạo chi tiết đơn hàng nội bộ (internal)
const createOrderDetailInternal = async ({
  productId,
  classificationId,
  orderId,
  quantity,
}) => {
  const orderDetailId = "OT" + Date.now();
  const newOrderDetail = await OrderDetail.create({
    orderDetailId,
    productId,
    classificationId,
    orderId,
    quantity,
  });
  return newOrderDetail;
};

const createOrderDetail = async (req, res) => {
  try {
    const { productId, classificationId, orderId, quantity } = req.body;
    const newOrderDetail = await exports.createOrderDetailInternal({
      productId,
      classificationId,
      orderId,
      quantity,
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
    if (!orderId)
      return res.status(400).json({ message: "Vui lòng cung cấp orderId!" });
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
    if (!orderDetail)
      return res
        .status(404)
        .json({ message: "Không tìm thấy chi tiết đơn hàng" });
    res.json(orderDetail);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Cập nhật orderDetail
const updateOrderDetail = async (req, res) => {
  try {
    const { id, comment, rate, imageEvaluate } = req.body;
    // Chỉ cập nhật các trường có giá trị
    const updateData = {};
    if (comment !== undefined) updateData.comment = comment;
    if (rate !== undefined) updateData.rate = rate;
    if (imageEvaluate !== undefined) updateData.imageEvaluate = imageEvaluate;

    const [updated] = await OrderDetail.update(updateData, {
      where: { orderDetailId: id },
    });
    if (!updated)
      return res
        .status(404)
        .json({ message: "Không tìm thấy chi tiết đơn hàng" });
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
    if (!deleted)
      return res
        .status(404)
        .json({ message: "Không tìm thấy chi tiết đơn hàng" });
    res.json({ message: "Xóa chi tiết đơn hàng thành công" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const rateProduct = async (req, res) => {
  const { productId, classificationId, rate, comment } = req.body;
  const accountId = req.user.accountId; // Lấy từ token

  try {
    // 1. Tìm tất cả orderDetail phù hợp (đơn đã thanh toán)
    const { Order } = require("../models");
    const orderDetails = await OrderDetail.findAll({
      where: { productId, classificationId },
      include: [
        {
          model: Order,
          as: "order",
          where: { accountId, status: "done" },
        },
      ],
      order: [["orderDetailId", "DESC"]], // Sắp xếp mới nhất trước
    });

    if (!orderDetails || orderDetails.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sản phẩm đã mua để đánh giá",
      });
    }

    // 2. Đánh giá bản ghi mới nhất
    const newestOrderDetail = orderDetails[0];
    newestOrderDetail.rate = rate;
    newestOrderDetail.comment = comment;
    await newestOrderDetail.save();

    // 3. Ghi đè comment và rate lên các bản ghi còn lại (nếu có)
    if (orderDetails.length > 1) {
      const updatePromises = orderDetails.slice(1).map((od) => {
        od.rate = rate;
        od.comment = comment;
        return od.save();
      });
      await Promise.all(updatePromises);
    }

    res.json({
      success: true,
      message: "Đánh giá thành công cho tất cả đơn hàng đã mua sản phẩm này",
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Lỗi server", error: err.message });
  }
};

module.exports = {
  createOrderDetail,
  getAllOrderDetails,
  getOrderDetailById,
  updateOrderDetail,
  deleteOrderDetail,
  createOrderDetailInternal,
  rateProduct,
};
