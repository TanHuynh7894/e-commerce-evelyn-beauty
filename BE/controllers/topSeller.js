import orderDetail from '../models/orderDetail.js';
import product from '../models/product.js';
import order from '../models/order.js';

export const getAllProductIds = async (req, res) => {
  try {
    const products = await orderDetail.findAll({
      attributes: ['productId', 'quantity', 'rate'],
      include: [
        {
          model: product,
          as: 'product',
          attributes: ['image']
        },
        {
          model: order,
          as: 'order',
          attributes: ['status']
        }
      ]
    });

    const productMap = {};

    products.forEach(item => {
      const { productId, quantity, rate } = item;
      const status = item.order?.status;
      const image = item.product?.image || null;

      // ✅ Chỉ duyệt khi đơn hàng đã 'done'
      if (status !== 'done') return;

      if (!productMap[productId]) {
        productMap[productId] = {
          quantity: quantity || 0,
          totalRate: rate || 0,
          countRate: rate ? 1 : 0,
          image: image
        };
      } else {
        productMap[productId].quantity += quantity || 0;
        if (rate !== null && rate !== undefined) {
          productMap[productId].totalRate += rate;
          productMap[productId].countRate += 1;
        }
      }
    });

    const result = Object.entries(productMap)
      .map(([productId, data]) => ({
        productId,
        quantity: data.quantity,
        averageRate: data.countRate > 0
          ? parseFloat((data.totalRate / data.countRate).toFixed(2))
          : null,
        countRate: data.countRate,
        image: data.image
      }))
      .sort((a, b) => b.quantity - a.quantity);

    res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching product stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
