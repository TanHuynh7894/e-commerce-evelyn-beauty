const { Payment, Order, OrderDetail, Cart, CartItem, Product, PromotionProgram, Profile } = require('../models');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const moment = require('moment');
const { Op } = require('sequelize');
require('dotenv').config();

exports.createPayOSLink = async (req, res) => {
  try {
    const accountId = req.user.accountId;
    const { profileId } = req.body;

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

    const promotion = promotions.find(promo => {
      if (!promo.condition2) return false;
      const allowedDays = promo.condition2.split(',').map(Number);
      return allowedDays.includes(dayOfWeek);
    });

    if (promotion) {
      discount = amount * parseFloat(promotion.value);
      promotionApplied = promotion.programId;
    }

    // 5. Tính phí vận chuyển từ profile
    // if (!profileId) return res.status(400).json({ message: 'Thiếu profileId' });

    // const profile = await Profile.findOne({ where: { profileId, accountId, status: 'ON' } });
    // if (!profile) return res.status(400).json({ message: 'Không tìm thấy hồ sơ giao hàng' });

    // //  Cập nhật chỗ này để truyền đúng cho calculateFee
    // const mockReq = {
    //   body: {
    //     toDistrict: profile.districtCode,
    //     toWard: profile.wardCode,
    //     service_id: 53320 // mã dịch vụ GHN tạm thời
    //   },
    //   user: { accountId }
    // };

    // const mockRes = {
    //   json: (data) => data
    // };

    // const feeResult = await calculateFee(mockReq, mockRes);
    // const shipFee = feeResult?.data?.total || 0;
    const finalAmount = Math.floor(amount - discount);

    // 6. Tạo orderCode và paymentId
    const orderCode = parseInt(moment().format('YYMMDDHHmmss')); 
    const paymentId = 'PM' + orderCode;

    // 7. Gửi request tới PayOS
    let checkoutUrl;
    const payload = {
      orderCode, // phải là số
      amount: finalAmount,
      description: 'Thanh toán đơn hàng Evelyn Beauty',
      cancelUrl: process.env.PAYOS_CANCEL_URL,
      returnUrl: process.env.PAYOS_RETURN_URL
    };

    console.log('Payload gửi PayOS:', payload);

    if (process.env.NODE_ENV === 'development') {
      // MOCK LOCAL
      checkoutUrl = `https://mock-checkout-url.com/pay/${orderCode}`;
      console.log('MOCK MODE: Fake checkoutUrl');
    } else {
      const response = await axios.post(
        'https://api-merchant.payos.vn/v2/payment-requests',
        payload,
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

    // 8. Lưu payment vào DB
    await Payment.create({ paymentId, transactionNo: 0 });

    // 9. Trả về FE
    res.status(200).json({
      checkoutUrl,
      orderCode,
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

// Webhook giữ nguyên như bạn đã viết
exports.handlePayOSWebhook = async (req, res) => {
  const { orderCode, status, transactionId, accountId } = req.body;

  try {
    const payment = await Payment.findByPk('PM' + orderCode); // Do paymentId là 'PM' + orderCode
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
        programId: null,
        profileId: profile.profileId
      });

      await OrderDetail.bulkCreate(
        items.map(i => ({
          orderDetailId: uuidv4().slice(0, 20),
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
