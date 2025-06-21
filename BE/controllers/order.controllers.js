const { Order, OrderDetail, Product } = require('../models');
const { nanoid } = require('nanoid');

exports.createOrder = async (req, res) => {
    const { shipFee, programId, paymentId, profileId, items } = req.body; // items: [{ productId, quantity }]
    const accountId = req.user.accountId;

    try {
        const orderId = 'OD' + Date.now();
        const newOrder = await Order.create({
            orderId,
            programId,
            shipFee,
            date: new Date(),
            status: 'in_transit',
            accountId,
            paymentId,
            profileId
        });

        const details = items.map(i => ({
            orderDetailId: nanoid(20),
            orderId,
            productId: i.productId,
            quantity: i.quantity
        }));
        await OrderDetail.bulkCreate(details);

        res.status(201).json({ message: 'Tạo đơn hàng thành công', orderId });
    } catch (err) {
        console.error('Lỗi tạo order:', err);
        res.status(500).json({ message: 'Tạo đơn hàng thất bại' });
    }
};

exports.getCustomerOrders = async (req, res) => {
    try {
        const orders = await Order.findAll({
            where: { accountId: req.user.accountId },
            include: [
                {
                    model: OrderDetail,
                    as: 'details',
                    include: [{ model: Product, as: 'product' }]
                }
            ]
        });

        const result = orders.map(order => ({
            orderId: order.orderId,
            date: order.date,
            status: order.status,
            items: order.details.map(d => ({
                productName: d.product.name,
                price: d.product.price,
                quantity: d.quantity,
                total: d.product.price * d.quantity
            }))
        }));

        res.json({ orders: result });
    } catch (err) {
        console.error('Lỗi lấy đơn hàng:', err);
        res.status(500).json({ message: 'Không thể lấy danh sách đơn hàng' });
    }
};

exports.getAllOrders = async (req, res) => {
    try {
        const orders = await Order.findAll({
            include: [
                {
                    model: OrderDetail,
                    as: 'details',
                    include: [{ model: Product, as: 'product' }]
                }
            ]
        });
        res.json({ orders });
    } catch (err) {
        console.error('Lỗi lấy all orders:', err);
        res.status(500).json({ message: 'Không thể lấy đơn hàng' });
    }
};

exports.updateOrderStatus = async (req, res) => {
    const { orderId } = req.params;
    const { status } = req.body;
    const staffId = req.user.accountId;

    try {
        const order = await Order.findByPk(orderId);
        if (!order) return res.status(404).json({ message: 'Không tìm thấy order' });

        order.status = status;
      

        await order.save();

        res.json({ message: 'Cập nhật trạng thái thành công', status });
    } catch (err) {
        console.error('Lỗi cập nhật order:', err);
        res.status(500).json({ message: 'Lỗi cập nhật trạng thái đơn hàng' });
    }
};

