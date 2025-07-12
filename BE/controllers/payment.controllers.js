const { Payment, Order, OrderDetail, Cart, CartItem, Product, PromotionProgram, Profile, } = require("../models");
const { v4: uuidv4 } = require("uuid");
const moment = require("moment");
const { Op } = require("sequelize");
const crypto = require("crypto");
const PayOS = require("@payos/node"); //  Dùng SDK
require("dotenv").config();
const { createOrderInternal } = require("../controllers/order.controllers");
const { calculateFeeFromProfileV2 } = require("../controllers/delivery.controllers");
const { createOrderDetailInternal } = require("../controllers/orderDetail.controllers");

const payOS = new PayOS(
  process.env.PAYOS_CLIENT_ID,
  process.env.PAYOS_API_KEY,
  process.env.PAYOS_CHECKSUM_KEY
);

exports.createPayOSLink = async (req, res) => {
  try {
    const accountId = req.user.accountId;
    const { profileId } = req.body;

    // 1. Lấy giỏ hàng
    const cart = await Cart.findOne({
      where: { accountId },
      attributes: ["cartId"],
    });
    if (!cart)
      return res.status(404).json({ message: "Không tìm thấy giỏ hàng" });

    // 2. Lấy sản phẩm trong giỏ hàng
    const cartItems = await CartItem.findAll({
      where: {
        cartId: cart.cartId,
        status: "ON", // Thêm điều kiện lọc
      },
      include: [
        {
          model: Product,
          as: "product", // phải đúng alias trong model
          attributes: ["productId", "price"],
        },
      ],
    });

    if (!cartItems.length) {
      return res
        .status(400)
        .json({ message: "Giỏ hàng trống hoặc không có sản phẩm ON" });
    }

    // 3. Tính tổng tiền
    const amount = cartItems.reduce(
      (sum, item) => sum + item.quantity * item.product.price,
      0
    );

    // 4. Áp dụng khuyến mãi (nếu có)
    let discount = 0;
    let promotionApplied = null;
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Chủ nhật

    const promotions = await PromotionProgram.findAll({
      where: {
        status: "ON",
        startDate: { [Op.lte]: today },
        endDate: { [Op.gte]: today },
        condition1: { [Op.lte]: amount },
      },
      order: [["value", "DESC"]],
    });

    const matchedPromo = promotions.find((promo) => {
      if (!promo.condition2) return false;
      const days = promo.condition2.split(",").map(Number);
      return days.includes(dayOfWeek);
    });

    if (matchedPromo) {
      discount = amount * parseFloat(matchedPromo.value);
      promotionApplied = matchedPromo.programId;
    }

    const baseAmount = Math.floor(amount - discount);

    const profile = await Profile.findByPk(profileId);
    if (!profile || !profile.address)
      return res
        .status(400)
        .json({ message: "Không tìm thấy địa chỉ giao hàng" });

    const feeData = await calculateFeeFromProfileV2(profile.address);
    const shipFee = feeData.total || 0;
    const finalAmount = baseAmount + shipFee;

    // 5. Tạo orderCode + paymentId
    const orderCode = parseInt(moment().format("YYMMDDHHmmss")); // 12 chữ số
    const paymentId = `PM${orderCode}`;

    const items = cartItems.map((item) => ({
      name: `SP-${item.productId}`,
      quantity: item.quantity,
      price: Number(item.product.price),
    }));
    const expiredAt = Math.floor(Date.now() / 1000) + 15 * 60;

    // 6. Tạo link thanh toán bằng SDK PayOS
    const payload = {
      orderCode,
      amount: finalAmount,
      description: `Thanh toán đơn `,
      cancelUrl: process.env.PAYOS_CANCEL_URL,
      returnUrl: process.env.PAYOS_RETURN_URL,
      items,
      expiredAt,
      buyer: {
        name: req.user?.name || "Khách hàng",
        email: req.user?.email || "user@example.com",
      },
    };

    const paymentLinkResponse = await payOS.createPaymentLink(payload);
    const checkoutUrl = paymentLinkResponse.checkoutUrl;

    if (!checkoutUrl) {
      console.error(
        "[PayOS] Không nhận được checkoutUrl:",
        paymentLinkResponse
      );
      return res
        .status(500)
        .json({ message: "Không nhận được đường dẫn thanh toán" });
    }

    // 7. Lưu payment tạm thời
    await Payment.create({ paymentId, transactionNo: 0 });

    // 8. Trả kết quả về FE
    res.status(200).json({
      checkoutUrl,
      orderCode,
      paymentId,
      amount,
      discount,
      finalAmount,
      promotionApplied,
    });
  } catch (error) {
    console.error("[PayOS] Lỗi khi tạo link:", error.message);
    return res
      .status(500)
      .json({ message: "Lỗi tạo link thanh toán", error: error.message });
  }
};

// Webhook xử lý thanh toán
// Flow: Handle PayOS webhook, get accountId from Profile (via ProfileId in Order), process order
exports.handlePayOSWebhook = async (req, res) => {
  try {
    console.log("\n===== Webhook PayOS Nhận =====");
    console.log("Payload Body:", req.body);

    const { data } = req.body;
    const rawOrderCode = data?.orderCode;
    const paymentId = 'PM' + rawOrderCode;
    const transactionId = data?.reference;
    const status = req.body?.code === "00" ? "PAID" : "FAILED";

    // 1. Tìm payment theo paymentId
    const payment = await Payment.findByPk(paymentId);
    if (!payment) {
      return res.sendStatus(404);
    }

    // 2. Cập nhật transactionId
    payment.transactionNo = transactionId || 0;
    await payment.save();

    // 3. Kiểm tra đã có order chưa
    const existingOrder = await Order.findOne({
      where: { paymentId },
    });

    if (existingOrder) {
      return res.sendStatus(200);
    }

    // 4. Truy accountId qua profile từ payment.profileId
    const profile = await Profile.findByPk(payment.profileId);
    if (!profile) {
      return res.status(400).json({ message: "Không tìm thấy profile" });
    }

    const accountIdFromDB = profile.accountId;

    // 5. Tìm cart theo accountId
    const cart = await Cart.findOne({ where: { accountId: accountIdFromDB } });
    if (!cart) return res.status(404).json({ message: "Không tìm thấy giỏ hàng" });

    // 6. Tìm sản phẩm trong cart
    const cartItems = await CartItem.findAll({
      where: { cartId: cart.cartId },
      include: [{ model: Product, as: "product", attributes: ["productId"] }]
    });

    if (!cartItems.length) return res.status(400).json({ message: "Giỏ hàng trống" });

    const items = cartItems.map((item) => ({
      productId: item.productId,
      classificationId: item.classificationId,
      quantity: item.quantity,
    }));

    const orderId = 'OD' + rawOrderCode;

    const createdOrderId = await createOrderInternal({
      orderId,
      shipFee: 0,
      programId: payment.programId,
      paymentId: payment.paymentId,
      profileId: profile.profileId,
      accountId: accountIdFromDB,
      items,
    });

    for (const item of items) {
      await createOrderDetailInternal({
        productId: item.productId,
        classificationId: item.classificationId,
        orderId: createdOrderId,
        quantity: item.quantity,
      });
    }

    await CartItem.update({ status: "OFF" }, { where: { cartId: cart.cartId } });

    console.log("\nHoàn tất xử lý webhook và tạo đơn hàng thành công");
    return res.sendStatus(200);
  } catch (error) {
    console.log("Lỗi xử lý webhook:", error);
    return res.sendStatus(500);
  }
};