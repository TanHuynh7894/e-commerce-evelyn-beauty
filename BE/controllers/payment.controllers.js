const { Payment, Order, OrderDetail, Cart, CartItem, Product, PromotionProgram, Profile } = require('../models');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const moment = require('moment');
const { Op } = require('sequelize');
require('dotenv').config();

exports.createPayOSLink = async (req, res) => {
  try {
    const accountId = req.user.accountId;

    // 1. Lấy giỏ hàng
    const cart = await Cart.findOne({ where: { accountId }, attributes: ['cartId', 'accountId'] });
    if (!cart) return res.status(404).json({ message: 'Không tìm thấy giỏ hàng' });

    // 2. Lấy sản phẩm trong giỏ hàng
    const cartItems = await CartItem.findAll({
      where: { cartId: cart.cartId },
      include: [{ model: Product, as: 'product', attributes: ['productId', 'price'] }]
    });
    if (cartItems.length === 0) return res.status(400).json({ message: 'Giỏ hàng trống' });

    // 3. Tính tổng tiền
    const amount = cartItems.reduce((total, item) => total + item.quantity * item.product.price, 0);

    // 4. Tìm chương trình khuyến mãi phù hợp
    let discount = 0;
    let promotionApplied = null;
    const today = new Date();
    const dayOfWeek = today.getDay();

    const promotions = await PromotionProgram.findAll({
      where: {
        status: 'ON',
        startDate: { [Op.lte]: today },
        endDate: { [Op.gte]: today },
        condition1: { [Op.lte]: amount }
      },
      order: [['value', 'DESC']]
    });

    // Kiểm tra ngày trong tuần phù hợp
    const promotion = promotions.find(promo => {
      // Giả định condition2 là kiểu String, ví dụ: '1,2,3' (Thứ 2,3,4)
      if (!promo.condition2) return false;
      const allowedDays = promo.condition2.split(',').map(Number); // convert thành array số
      return allowedDays.includes(dayOfWeek);
    });

    if (promotion) {
      discount = amount * parseFloat(promotion.value);
      promotionApplied = promotion.programId;
    }

    const finalAmount = Math.floor(amount - discount);
    const paymentId = 'PM' + moment().format('YYYYMMDDHHmmss');

    let checkoutUrl;
    const payload = {
      orderCode: paymentId,
      amount: finalAmount,
      description: 'Thanh toán đơn hàng Evelyn Beauty',
      cancelUrl: process.env.PAYOS_CANCEL_URL,
      returnUrl: process.env.PAYOS_RETURN_URL
    };

    console.log('📤 Payload gửi PayOS:', payload);
    console.log('DEBUG', { orderCode: paymentId, amount: finalAmount, cancelUrl: process.env.PAYOS_CANCEL_URL, returnUrl: process.env.PAYOS_RETURN_URL });

    if (process.env.NODE_ENV === 'development') {
      //  MOCK LOCAL
      checkoutUrl = `https://mock-checkout-url.com/pay/${paymentId}`;
      console.log(' MOCK MODE: Fake checkoutUrl');
    } else {
      //  Production thật
      const response = await axios.post(
        'https://api-merchant.payos.vn/v2/payment-requests',
        {
          orderCode: paymentId,
          amount: finalAmount,
          description: 'Thanh toán đơn hàng Evelyn Beauty',
          cancelUrl: process.env.PAYOS_CANCEL_URL,
          returnUrl: process.env.PAYOS_RETURN_URL
        },
        {
          headers: {
            'x-client-id': process.env.PAYOS_CLIENT_ID,
            'x-api-key': process.env.PAYOS_API_KEY,
            'Content-Type': 'application/json'
          }
        }
      );
      checkoutUrl = response?.data?.checkoutUrl;
      if (!checkoutUrl) {
        console.error('Không có checkoutUrl:', response?.data);
        return res.status(500).json({ message: 'Không nhận được checkoutUrl', rawResponse: response?.data });
      }
    }

    // Lưu payment
    await Payment.create({ paymentId, transactionNo: 0 });

    // Trả về FE
    res.status(200).json({
      checkoutUrl,
      orderCode: paymentId,
      paymentId,
      amount,
      discount,
      finalAmount,
      promotionApplied
    });

  } catch (err) {
    console.error('Lỗi khi tạo PayOS:', err);
    res.status(500).json({ message: 'Lỗi tạo link thanh toán' });
  }
};

// Webhook Giữ nguyên
// Webhook (đã fix chuẩn)
exports.handlePayOSWebhook = async (req, res) => {
  const { orderCode, status, transactionId, accountId } = req.body;

  try {
    // 1. Tìm payment
    const payment = await Payment.findByPk(orderCode);
    if (!payment) return res.sendStatus(404);

    // 2. Check order đã tồn tại chưa
    const existingOrder = await Order.findOne({ where: { paymentId: orderCode } });
    if (status === 'PAID' && !existingOrder) {
      // 3. Cập nhật transactionNo
      payment.transactionNo = transactionId || 0;
      await payment.save();

      // 4. Tìm giỏ hàng
      const cart = await Cart.findOne({ where: { accountId }, attributes: ['cartId', 'accountId'] });
      if (!cart) return res.sendStatus(404);

      // 5. Lấy profileId từ bảng Profiles
      const profile = await Profile.findOne({ where: { accountId } });
      if (!profile) return res.status(400).json({ message: 'Không tìm thấy profile' });

      // 6. Lấy sản phẩm trong giỏ
      const items = await CartItem.findAll({
        where: { cartId: cart.cartId },
        include: [{ model: Product, as: 'product', attributes: ['productId'] }]
      });
      if (items.length === 0) return res.sendStatus(400);

      // 7. Tạo đơn hàng mới
      const orderId = 'OD' + Date.now();
      await Order.create({
        orderId,
        status: 'in_transit',
        accountId: cart.accountId,
        paymentId: payment.paymentId,
        date: new Date(),
        programId: null, // PromotionProgram nên lưu trong payment hoặc truyền từ webhook nếu cần
        profileId: profile.profileId
      });

      // 8. Order details
      await OrderDetail.bulkCreate(
        items.map(i => ({
          orderDetailId: uuidv4().slice(0, 20),
          orderId,
          productId: i.productId,
          quantity: i.quantity
        }))
      );

      // 9. Xóa giỏ hàng
      await CartItem.destroy({ where: { cartId: cart.cartId } });
    }

    res.sendStatus(200);
  } catch (err) {
    console.error('Webhook lỗi:', err);
    res.sendStatus(500);
  }
};