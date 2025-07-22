const { where } = require("sequelize");
const {
  Order,
  OrderDetail,
  Product,
  Profile,
  Delivery,
  PromotionProgram,
  Account,
  Payment,
  Classification,
} = require("../models");
const { nanoid } = require("nanoid");

//  Tách hàm tái sử dụng để gọi từ cả createOrder và webhook
exports.createOrderInternal = async ({
  shipFee,
  programId,
  paymentId,
  profileId,
  items,
  accountId,
  orderId: customOrderId,
}) => {
  const orderId = customOrderId;

  const newOrder = await Order.create({
    orderId,
    programId,
    shipFee,
    date: new Date(),
    status: "in_transit",
    accountId,
    paymentId,
    profileId,
  });
  return orderId;
};

// API tạo order (gọi từ FE checkout bình thường)
// exports.createOrder = async (req, res) => {
//     const { shipFee, programId, paymentId, profileId, items } = req.body;
//     const accountId = req.user.accountId;

//     try {
//         const orderId = await exports.createOrderInternal({
//             shipFee,
//             programId,
//             paymentId,
//             profileId,
//             items,
//             accountId
//         });

//         const now = Date.now();
//         const details = items.map((i, index) => ({
//             orderDetailId: `OD${now}${index}`,
//             orderId,
//             productId: i.productId,
//             classificationId: i.classificationId,
//             quantity: i.quantity
//         }));

//         await OrderDetail.bulkCreate(details);

//         res.status(201).json({ message: 'Tạo đơn hàng thành công', orderId });
//     } catch (err) {
//         console.error('Lỗi tạo order:', err);
//         res.status(500).json({ message: 'Tạo đơn hàng thất bại' });
//     }
// };

// Mua ngay 1 sản phẩm (không qua giỏ hàng)
// exports.buyNow = async (req, res) => {
//     const { productId, paymentId, profileId, programId, shipFee } = req.body;
//     const accountId = req.user.accountId;

//     try {
//         if (!productId || !paymentId || !profileId || !programId) {
//             return res.status(400).json({ message: 'Thiếu dữ liệu bắt buộc' });
//         }

//         const orderId = await exports.createOrderInternal({
//             shipFee: shipFee || 0,
//             programId,
//             paymentId,
//             profileId,
//             accountId,
//             items: [{ productId, quantity: 1 }]
//         });

//         res.status(201).json({ message: 'Mua ngay thành công', orderId });
//     } catch (error) {
//         console.error('Buy Now Error:', error);
//         res.status(500).json({ message: 'Không thể thực hiện mua ngay' });
//     }
// };

exports.getCustomerOrders = async (req, res) => {
  try {
    const accountId = req.user?.accountId;

    // 1. Lấy tất cả profile thuộc account hiện tại
    const profiles = await Profile.findAll({
      where: { accountId },
    });

    const profileIds = profiles.map((p) => p.profileId);
    if (profileIds.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy hồ sơ nào" });
    }

    // 2. Lấy tất cả đơn hàng theo profileId
    const orders = await Order.findAll({
      where: { profileId: profileIds },
      include: [
        {
          model: OrderDetail,
          as: "details",
          include: [
            {
              model: Product,
              as: "product",
            },
            {
              model: Classification,
              as: "classification_id", //  Sửa lại đúng alias
              attributes: ["name"],
            },
          ],
        },
        {
          model: PromotionProgram,
          as: "promotionProgram",
          attributes: ["value"],
        },
        {
          model: Account,
          as: "account",
          attributes: ["name"],
        },
        {
          model: Payment,
          as: "payment",
          attributes: ["transaction_no"],
        },
        {
          model: Delivery,
          as: "delivery",
          attributes: ["transaction_no"],
        },
        {
          model: Profile,
          as: "profile",
          attributes: ["name", "phone", "address"],
        },
      ],
    });

    // 3. Tính tổng đơn hàng, chiết khấu, tổng thanh toán
    const enrichedOrders = orders.map((order) => {
      let totalBefore = 0;

      if (order.details && Array.isArray(order.details)) {
        totalBefore = order.details.reduce((sum, detail) => {
          const price = Number(detail.product?.price) || 0;
          const quantity = Number(detail.quantity) || 0;
          return sum + price * quantity;
        }, 0);
      }

      const shipFee = Number(order.shipFee) || 0;
      totalBefore += shipFee;

      const programValue = Number(order.promotionProgram?.value) || 0;
      const discount = totalBefore * programValue;
      const totalFinal = totalBefore - discount;

      return {
        orderId: order.orderId,
        profileId: order.profileId, // ✅ Thêm profileId
        date: order.date,
        status: order.status,
        shipFee: order.shipFee,
        transactionNo: order.delivery?.transaction_no || null,
        discount: Number(discount.toFixed(2)),
        total_before: totalBefore,
        total_final: Number(totalFinal.toFixed(2)),
        profile: order.profile,
        account: order.account,
        payment: order.payment,
        promotionProgram: order.promotionProgram,
        details: order.details.map((d) => ({
          productId: d.productId,
          productName: d.product?.name,
          classification: d.classification?.name || null,
          price: Number(d.product?.price) || 0,
          quantity: d.quantity,
          total: Number(d.product?.price || 0) * d.quantity,
        })),
      };
    });

    res.json({ orders: enrichedOrders });
  } catch (err) {
    console.error("Lỗi lấy đơn hàng người dùng:", err);
    res.status(500).json({ message: "Không thể lấy danh sách đơn hàng" });
  }
};



exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      include: [
        {
          model: OrderDetail,
          as: "details",
          include: [
            {
              model: Product,
              as: "product",
            },
            {
              model: Classification,
              as: "classification",
              attributes: ["name"], // lấy tên phân loại
            },
          ],
        },
        {
          model: PromotionProgram,
          as: "promotionProgram", // phải đúng với Order.associate
          attributes: ["value"],
        },
        {
          model: Account,
          as: "account",
          attributes: ["name"],
        },
        {
          model: Payment,
          as: "payment",
          attributes: ["transaction_no"],
        },
        {
          model: Delivery,
          as: "delivery",
          attributes: ["transaction_no"],
        },
        {
          model: Profile,
          as: "profile",
          attributes: ["name", "phone", "address"],
        },
      ],
    });

    // Tính tổng đơn hàng, chiết khấu, tổng thanh toán
    const enrichedOrders = orders.map((order) => {
      let totalBefore = 0;

      if (order.details && Array.isArray(order.details)) {
        totalBefore = order.details.reduce((sum, detail) => {
          const price = Number(detail.product?.price) || 0;
          const quantity = Number(detail.quantity) || 0;
          return sum + price * quantity;
        }, 0);
      }

      const shipFee = Number(order.shipFee) || 0;
      totalBefore += shipFee;

      const programValue = Number(order.promotionProgram?.value) || 0;
      const discount = totalBefore * programValue;
      const totalFinal = totalBefore - discount;

      return {
        ...order.toJSON(),
        total_before: totalBefore,
        discount: Number(discount.toFixed(2)),
        total_final: Number(totalFinal.toFixed(2)),
      };
    });

    res.json({ orders: enrichedOrders });
  } catch (err) {
    console.error("Lỗi lấy all orders:", err);
    res.status(500).json({ message: "Không thể lấy đơn hàng" });
  }
};

exports.updateOrderStatus = async (req, res) => {
  const { orderId } = req.params;
  const { status, deliveryId } = req.body; // Lấy thêm deliveryId
  const accountId = req.user.accountId; // Lấy từ token (JWT)

  try {
    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy order" });
    }

    order.status = status;
    order.deliveryId = deliveryId;
    order.accountId = accountId;

    await order.save();

    res.json({
      message: "Cập nhật trạng thái và người giao hàng thành công",
      status,
      deliveryId,
    });
  } catch (err) {
    console.error("Lỗi cập nhật order:", err);
    res.status(500).json({ message: "Lỗi cập nhật trạng thái đơn hàng" });
  }
};

exports.cancelOrder = async (req, res) => {
  const { orderId } = req.params;
  const accountId = req.user.accountId;

  try {
    const order = await Order.findByPk(orderId);

    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }

    // Check quyền sở hữu đơn hàng
    if (order.accountId !== accountId) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền hủy đơn hàng này" });
    }

    // Check trạng thái có thể hủy không
    if (order.status !== "in_transit") {
      return res
        .status(400)
        .json({ message: "Chỉ có thể hủy đơn đang giao (in_transit)" });
    }

    order.status = "cancel";
    await order.save();

    res.json({ message: "Đã hủy đơn hàng thành công", orderId: order.orderId });
  } catch (err) {
    console.error("Lỗi hủy đơn hàng:", err);
    res.status(500).json({ message: "Không thể hủy đơn hàng" });
  }
};

exports.getRefundOrders = async (req, res) => {
  try {
    const refundOrders = await Order.findAll({
      where: { status: "return_approved" },
      attributes: ["orderId", "programId", "shipFee", "date", "status"],
      include: [
        {
          model: PromotionProgram,
          as: "promotionProgram",
          attributes: ["programId", "value"],
        },
        {
          model: Payment,
          as: "payment",
          attributes: [
            "paymentId",
            "transactionNo",
            "accountBankId",
            "accountName",
            "accountNumber",
          ],
        },
        {
          model: Delivery,
          as: "delivery",
          attributes: ["deliveryId", "transaction_no"],
        },
        {
          model: Account,
          as: "account",
          attributes: ["accountId", "name"],
        },
        {
          model: Profile,
          as: "profile",
          attributes: ["profileId", "name"],
        },
      ],
      order: [["date", "DESC"]],
    });

    // Format value thành phần trăm nếu có PromotionProgram
    const formattedOrders = refundOrders.map((order) => {
      const data = order.toJSON();

      // Format phần trăm từ value
      if (
        data.promotionProgram?.value !== undefined &&
        data.promotionProgram?.value !== null
      ) {
        data.promotionProgram.value = `${parseFloat(
          data.promotionProgram.value * 100
        ).toFixed(0)}%`;
      }

      // Nếu không có Delivery thì gán nội dung thay thế
      if (!data.delivery) {
        data.delivery = "Chưa có thông tin giao hàng";
      }

      return data;
    });

    res.status(200).json({
      message: "Danh sách đơn hàng hoàn trả",
      data: formattedOrders,
    });
  } catch (error) {
    console.error("Lỗi lấy đơn hàng refund:", error);
    res.status(500).json({ message: "Lỗi hệ thống", error: error.message });
  }
};
