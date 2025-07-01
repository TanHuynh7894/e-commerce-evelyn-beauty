const { Order, OrderDetail, Product } = require('../models');
const axios = require('axios');
require('dotenv').config();

exports.generateVietQRFromOrder = async (req, res) => {
  const { orderId } = req.params;

  try {
    // 1. Lấy thông tin order + chi tiết + sản phẩm
    const order = await Order.findByPk(orderId, {
      include: [
        {
          model: OrderDetail,
          as: 'details',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: [
                'productId', 'name', 'origin',
                'brand', 'price', 'description', ['image_1', 'image']
              ]

            }
          ]
        }
      ]
    });

    if (!order)
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });

    // 2. Tính tổng tiền
    let totalProductCost = 0;
    order.details.forEach(detail => {
      totalProductCost += detail.quantity * detail.product.price;
    });

    const shipFee = parseFloat(order.shipFee) || 0;
    const totalAmount = totalProductCost + shipFee;

    // 3. Gọi API VietQR
    const response = await axios.post('https://api.vietqr.io/v2/generate', {
      accountNo: process.env.VIETQR_ACCOUNT_NO,
      accountName: process.env.VIETQR_ACCOUNT_NAME,
      acqId: process.env.VIETQR_BANK_CODE,
      amount: totalAmount,
      addInfo: orderId,
      template: process.env.VIETQR_TEMPLATE || 'compact2',
    });

    // 4. Trả về QR Base64 và thông tin thanh toán
    return res.status(200).json({
      message: 'Tạo mã thanh toán thành công',
      qrBase64: response.data.data.qrDataURL,
      orderId,
      totalAmount,
      shipFee,
      items: order.details.map(d => ({
        name: d.product.name,
        quantity: d.quantity,
        price: d.product.price,
        total: d.quantity * d.product.price
      }))
    });

  } catch (err) {
    console.error('Lỗi tạo VietQR:', err.response?.data || err);
    return res.status(500).json({ message: 'Không thể tạo mã QR thanh toán' });
  }
};

