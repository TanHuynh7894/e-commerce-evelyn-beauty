import orderDetail from '../models/orderDetail.js';

export const getAllProductIds = async (req, res) => {
  try {
    const products = await orderDetail.findAll({
      attributes: ['productId', 'quantity', 'rate']
    });

    // Gom nhóm theo productId
    const productMap = {};

    products.forEach(({ productId, quantity, rate }) => {
      if (!productMap[productId]) {
        productMap[productId] = {
          quantity: quantity || 0,
          totalRate: rate || 0,
          countRate: rate ? 1 : 0
        };
      } else {
        productMap[productId].quantity += quantity || 0;
        if (rate !== null && rate !== undefined) {
          productMap[productId].totalRate += rate;
          productMap[productId].countRate += 1;
        }
      }
    });

    // Chuyển object sang array và tính averageRate
    const result = Object.entries(productMap)
      .map(([productId, data]) => ({
        productId,
        quantity: data.quantity,
        averageRate: data.countRate > 0
          ? parseFloat((data.totalRate / data.countRate).toFixed(2))
          : null,
        countRate: data.countRate
      }))
      .sort((a, b) => b.quantity - a.quantity); // Sắp xếp theo quantity giảm dần

    res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching product stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
