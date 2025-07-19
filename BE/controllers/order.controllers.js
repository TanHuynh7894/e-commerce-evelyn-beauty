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
    // Bước 1: Lấy tất cả profile theo accountId
    const profiles = await Profile.findAll({
      where: { accountId: req.user.accountId },
    });

    // Bước 2: Lấy danh sách profileId
    const profileIds = profiles.map((p) => p.profileId);

    if (profileIds.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy hồ sơ nào" });
    }

    // Bước 3: Lấy tất cả đơn hàng thuộc các profile đó + delivery + details + product
    const orders = await Order.findAll({
      where: { profileId: profileIds },
      include: [
        {
          model: OrderDetail,
          as: "details",
          include: [{ model: Product, as: "product" }],
        },
        {
          model: Delivery,
          as: "delivery",
          attributes: ["transaction_no"],
        },
      ],
    });

    // Bước 4: Chuyển dữ liệu thành dạng dễ đọc
    const result = orders.map((order) => ({
      orderId: order.orderId,
      date: order.date,
      status: order.status,
      transactionNo: order.delivery?.transaction_no || null,
      items: order.details.map((d) => ({
        productName: d.product.name,
        price: d.product.price,
        quantity: d.quantity,
        total: d.product.price * d.quantity,
      })),
    }));

    res.json({ orders: result });
  } catch (err) {
    console.error("Lỗi lấy đơn hàng:", err);
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
          include: [{ model: Product, as: "product" }],
        },
      ],
    });
    res.json({ orders });
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
