const {
  Payment,
  Order,
  OrderDetail,
  Cart,
  CartItem,
  Product,
  PromotionProgram,
  Profile,
  ClassificationProduct,
} = require("../models");
const { v4: uuidv4 } = require("uuid");
const moment = require("moment");
const { Op, where } = require("sequelize");
const crypto = require("crypto");
const PayOS = require("@payos/node"); //  Dùng SDK
require("dotenv").config();
const { createOrderInternal } = require("../controllers/order.controllers");
const {
  calculateFeeFromProfileV2,
} = require("../controllers/delivery.controllers");
const {
  createOrderDetailInternal,
} = require("../controllers/orderDetail.controllers");
const {
  getTransactionFromPayOSByOrderCode,
} = require("../middlewares/payment.midedlewares");

const payOS = new PayOS(
  process.env.PAYOS_CLIENT_ID,
  process.env.PAYOS_API_KEY,
  process.env.PAYOS_CHECKSUM_KEY
);

exports.createPayOSLink = async (req, res) => {
  try {
    const accountId = "AC000";
    const { profileId, promotionProgramId, items } = req.body;

    if (!profileId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Thiếu dữ liệu đầu vào" });
    }

    const realPromotionId =
      promotionProgramId == null ? "PG000" : promotionProgramId;

    // 1️ Lấy địa chỉ từ profile
    const profile = await Profile.findByPk(profileId);
    if (!profile || !profile.address) {
      return res
        .status(400)
        .json({ message: "Không tìm thấy địa chỉ giao hàng" });
    }

    // 2️ Tính tổng tiền hàng và gom lại thông tin chi tiết mỗi sản phẩm
    let amount = 0;
    const fullItems = [];

    for (const item of items) {
      // Tìm sản phẩm theo productId
      const product = await Product.findByPk(item.productId);
      if (!product) {
        return res
          .status(404)
          .json({ message: `Không tìm thấy sản phẩm ${item.productId}` });
      }

      // Kiểm tra xem có classificationId không (bắt buộc)
      if (!item.classificationId) {
        return res.status(400).json({
          message: `Thiếu classificationId cho sản phẩm ${item.productId}`,
        });
      }

      // Tính tổng tiền và gom lại item chi tiết
      amount += product.price * item.quantity;
      fullItems.push({
        ...item,
        price: product.price, // thêm giá để dùng cho thanh toán
      });
    }

    // 3 Áp dụng khuyến mãi nếu có
    let discount = 0;
    let promotion = null;
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday

    let validCondition1 = true;
    let validCondition2 = true;
    let isValidPromo = false;

    if (realPromotionId) {
      promotion = await PromotionProgram.findByPk(promotionProgramId);

      const hasCondition1 = promotion?.condition1 !== null;
      const hasCondition2 = promotion?.condition2 !== null;

      validCondition1 = hasCondition1 ? amount >= promotion.condition1 : true;
      validCondition2 = hasCondition2
        ? promotion.condition2.split(",").map(Number).includes(currentDay)
        : true;

      //  NEW LOGIC: Nếu không có cả condition1 và condition2 → vẫn hợp lệ nếu thời gian và status đúng
      const noConditions = !hasCondition1 && !hasCondition2;

      isValidPromo =
        promotion &&
        promotion.status === "ON" &&
        new Date(promotion.startDate) <= today &&
        new Date(promotion.endDate) >= today &&
        (noConditions || (validCondition1 && validCondition2));

      if (!isValidPromo) {
        return res
          .status(400)
          .json({ message: "Chương trình khuyến mãi không hợp lệ" });
      }

      discount = amount * parseFloat(promotion.value);

      // Log kiểm tra
      console.log(" Kiểm tra khuyến mãi:", {
        programId: promotion.programId,
        startDate: promotion.startDate,
        endDate: promotion.endDate,
        today,
        status: promotion.status,
        amount,
        currentDay,
        condition1: promotion.condition1,
        condition2: promotion.condition2,
        value: promotion.value,
        validCondition1,
        validCondition2,
        noConditions,
        isValidPromo,
      });
    }
    const baseAmount = Math.floor(amount - discount);

    // 4 Tính phí giao hàng
    const feeData = await calculateFeeFromProfileV2(profile.address);

    // Nếu áp dụng mã freeship (PG001) thì miễn phí ship
    let shipFee = 0;
    if (!promotion || promotion.programId !== "PG001") {
      shipFee = feeData.total || 0;
    }

    const finalAmount = baseAmount + shipFee;

    // 5 Tạo orderCode, orderId, paymentId
    const orderCode = parseInt(moment().format("YYMMDDHHmmss"));
    const paymentId = `PM${orderCode}`;
    const orderId = `OD${orderCode}`;

    // 6️ Tạo bản ghi payment TRƯỚC để tránh lỗi FK
    await Payment.create({
      paymentId,
      transactionNo: 0,
    });
    console.log("Đã tạo bản ghi Payment:", paymentId);

    // 7 Sau đó mới tạo Order
    await createOrderInternal({
      orderId,
      shipFee,
      programId: promotion?.programId || null,
      paymentId,
      profileId,
      accountId,
      items: fullItems, // được tái sử dụng ở bước dưới
    });
    console.log(" Đã tạo Order:", orderId);

    // 8 Tạo OrderDetail cho từng item
    for (const item of fullItems) {
      await createOrderDetailInternal({
        productId: item.productId,
        classificationId: item.classificationId,
        orderId,
        quantity: item.quantity,
      });
    }
    console.log(" Đã tạo chi tiết đơn hàng (OrderDetail)");

    // 9 Gửi yêu cầu tạo link thanh toán tới PayOS
    let payload = {
      orderCode,
      amount: finalAmount,
      description: `ORDER=${orderId}`,
      cancelUrl: process.env.PAYOS_CANCEL_URL,
      returnUrl: process.env.PAYOS_RETURN_URL,
      items: fullItems.map((i) => ({
        name: `SP-${i.productId}`,
        quantity: i.quantity,
        price: Number(i.price),
      })),
      expiredAt: Math.floor(Date.now() / 1000) + 15 * 60,
      buyer: {
        name: req.user?.name || "Khách hàng",
        email: req.user?.email || "user@example.com",
      },
    };

    const paymentLink = await payOS.createPaymentLink(payload);
    const checkoutUrl = paymentLink.checkoutUrl;

    if (!checkoutUrl) {
      console.error(" Không nhận được checkoutUrl:", paymentLink);
      return res
        .status(500)
        .json({ message: "Không nhận được link thanh toán" });
    }

    console.log(" Tạo link thanh toán thành công:", checkoutUrl);

    //  Trả dữ liệu về frontend
    return res.status(200).json({
      checkoutUrl,
      orderCode,
      paymentId,
      orderId,
      amount,
      discount,
      finalAmount,
      promotionApplied: promotion?.programId || null,
    });
  } catch (err) {
    console.error(" Lỗi khi tạo link thanh toán:", err);
    return res
      .status(500)
      .json({ message: "Lỗi hệ thống", error: err.message });
  }
};

exports.handlePayOSWebhook = async (req, res) => {
  try {
    console.log("Webhook PayOS nhận:");
    console.dir(req.body, { depth: null });

    const { data } = req.body;
    const rawOrderCode = data?.orderCode;
    const paymentId = `PM${rawOrderCode}`;
    const transactionId = data?.reference;
    const AccountBankId = data?.counterAccountBankId;
    const AccountName = data?.counterAccountName;
    const AccountNumber = data?.counterAccountNumber;

    // Xác định trạng thái từ webhook
    let status = "CANCELLED";
    const payosStatus = data?.status || data?.state || "";

    if (payosStatus === "PAID") status = "PAID";
    else if (payosStatus === "FAILED") status = "FAILED";

    console.log("paymentId:", paymentId);
    console.log("Transaction ID:", transactionId);
    console.log("Status xác định:", status);

    const payment = await Payment.findByPk(paymentId);
    if (!payment) {
      console.warn("Không tìm thấy payment");
      return res.status(404).json({ message: "Không tìm thấy payment" });
    }

    payment.transactionNo = transactionId || "0";
    payment.AccountBankId = AccountBankId || null;
    payment.AccountName = AccountName || null;
    payment.AccountNumber = AccountNumber || null;
    await payment.save();
    console.log("Cập nhật thông tin transaction");

    const order = await Order.findOne({ where: { paymentId } });
    if (!order) {
      console.warn("Không tìm thấy order theo paymentId");
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }

    if (status === "PAID") {
      const orderDetails = await OrderDetail.findAll({
        where: { orderId: order.orderId },
      });

      for (const item of orderDetails) {
        const classification = await ClassificationProduct.findOne({
          where: {
            classificationId: item.classificationId,
            productId: item.productId,
          },
        });

        if (classification) {
          const before = classification.quantity;
          classification.quantity = Math.max(0, before - item.quantity);
          await classification.save();
          console.log(`Cập nhật tồn kho: ${before} ➝ ${classification.quantity}`);
        } else {
          console.warn("Không tìm thấy classification:", item);
        }
      }

      const cart = await Cart.findOne({ where: { accountId: order.accountId } });
      if (cart) {
        for (const item of orderDetails) {
          await CartItem.update(
            { status: "OFF" },
            {
              where: {
                cartId: cart.cartId,
                productId: item.productId,
                classificationId: item.classificationId,
              },
            }
          );
        }
        console.log("Đã cập nhật trạng thái các mục trong giỏ hàng thành OFF");
      }

    }
    return res.status(200).json({
      message: "Webhook đã xử lý thành công",
      orderCode: rawOrderCode,
      status,
    });

  } catch (err) {
    console.error("Lỗi xử lý webhook:", err);
    return res.status(500).json({
      message: "Lỗi khi xử lý webhook",
      error: err.message,
    });
  }
};


exports.getTransactionInfo = async (req, res) => {
  const { orderCode } = req.params;
  const result = await getTransactionFromPayOSByOrderCode(orderCode);

  if (result.success) {
    return res.status(200).json({
      message: result.message,
      data: result.data,
    });
  } else {
    return res.status(500).json({
      message: result.message,
      error: result.error,
    });
  }
};

exports.cancelOrderByClient = async (req, res) => {
  try {
    const { orderCode } = req.body;
    const paymentId = `PM${orderCode}`;

    const order = await Order.findOne({ where: { paymentId } });
    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }

    // Cập nhật trạng thái đơn hàng
    await order.update({ status: 'cancel' });
    return res.status(200).json({ message: "Đã cập nhật đơn hàng thành cancel" });
  } catch (err) {
    console.error("Lỗi hủy đơn hàng:", err);
    return res.status(500).json({ message: "Lỗi hệ thống", error: err.message });
  }
};
