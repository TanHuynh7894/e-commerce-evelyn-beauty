const { Payment, Order, OrderDetail, Cart, CartItem, Product, PromotionProgram, Profile } = require('../models');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const { Op } = require('sequelize');
const crypto = require('crypto');
const PayOS = require('@payos/node'); //  Dùng SDK
require('dotenv').config();

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
    const cart = await Cart.findOne({ where: { accountId }, attributes: ['cartId'] });
    if (!cart) return res.status(404).json({ message: 'Không tìm thấy giỏ hàng' });

    // 2. Lấy sản phẩm trong giỏ hàng
    const cartItems = await CartItem.findAll({
      where: { cartId: cart.cartId },
      include: [{ model: Product, as: 'product', attributes: ['productId', 'price'] }]
    });
    if (!cartItems.length) return res.status(400).json({ message: 'Giỏ hàng trống' });

    // 3. Tính tổng tiền
    const amount = cartItems.reduce((sum, item) => sum + item.quantity * item.product.price, 0);

    // 4. Áp dụng khuyến mãi (nếu có)
    let discount = 0;
    let promotionApplied = null;
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Chủ nhật

    const promotions = await PromotionProgram.findAll({
      where: {
        status: 'ON',
        startDate: { [Op.lte]: today },
        endDate: { [Op.gte]: today },
        condition1: { [Op.lte]: amount }
      },
      order: [['value', 'DESC']]
    });

    const matchedPromo = promotions.find(promo => {
      if (!promo.condition2) return false;
      const days = promo.condition2.split(',').map(Number);
      return days.includes(dayOfWeek);
    });

    if (matchedPromo) {
      discount = amount * parseFloat(matchedPromo.value);
      promotionApplied = matchedPromo.programId;
    }

    const finalAmount = Math.floor(amount - discount);

    // 5. Tạo orderCode + paymentId
    const orderCode = parseInt(moment().format('YYMMDDHHmmss')); // 12 chữ số
    const paymentId = `PM${orderCode}`;

    const items = cartItems.map(item => ({
      name: `SP-${item.productId}`,
      quantity: item.quantity,
      price: Number(item.product.price)
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
        name: req.user?.name || 'Khách hàng',
        email: req.user?.email || 'user@example.com'
      }
    };

    const paymentLinkResponse = await payOS.createPaymentLink(payload);
    const checkoutUrl = paymentLinkResponse.checkoutUrl;

    if (!checkoutUrl) {
      console.error('[PayOS] Không nhận được checkoutUrl:', paymentLinkResponse);
      return res.status(500).json({ message: 'Không nhận được đường dẫn thanh toán' });
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
      promotionApplied
    });

  } catch (error) {
    console.error('[PayOS] Lỗi khi tạo link:', error.message);
    return res.status(500).json({ message: 'Lỗi tạo link thanh toán', error: error.message });
  }
};

// Webhook xử lý thanh toán
exports.handlePayOSWebhook = async (req, res) => {
  const { orderCode, status, transactionId, accountId } = req.body;

  try {
    const payment = await Payment.findByPk(orderCode); // Do paymentId là 'PM' + orderCode
    if (!payment) return res.sendStatus(404);

    const existingOrder = await Order.findOne({ where: { paymentId: 'PM' + orderCode } });
    if (status === 'PAID' && !existingOrder) {
      payment.transactionNo = transactionId || 0;
      await payment.save();

      const cart = await Cart.findOne({ where: { accountId }, attributes: ['cartId', 'accountId'] });
      if (!cart) return res.sendStatus(404);

      const profile = await Profile.findOne({ where: { accountId } });
      if (!profile) return res.status(400).json({ message: 'Không tìm thấy profile' });

      const items = await CartItem.findAll({
        where: { cartId: cart.cartId },
        include: [{ model: Product, as: 'product', attributes: ['productId'] }]
      });
      if (items.length === 0) return res.sendStatus(400);

      const orderId = 'OD' + Date.now();
      await Order.create({
        orderId,
        status: 'in_transit',
        accountId: cart.accountId,
        paymentId: payment.paymentId,
        date: new Date(),
        programId: 'PG002',
        profileId: profile.profileId
      });

      await OrderDetail.bulkCreate(
        items.map(i => ({
          orderDetailId:`OD${Date.now()}${index}`,
          orderId,
          productId: i.productId,
          quantity: i.quantity
        }))
      );

      await CartItem.destroy({ where: { cartId: cart.cartId } });
    }

    res.sendStatus(200);
  } catch (err) {
    console.error('Webhook lỗi:', err);
    res.sendStatus(500);
  }
};
