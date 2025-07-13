const { Order, OrderDetail, Product } = require('../models');
const { nanoid } = require('nanoid');

//  Tách hàm tái sử dụng để gọi từ cả createOrder và webhook
exports.createOrderInternal = async ({ shipFee, programId, paymentId, profileId, items, accountId, orderId: customOrderId }) => {
    const orderId = customOrderId || ('OD' + Date.now());

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
    return orderId;
};

// API tạo order (gọi từ FE checkout bình thường)
exports.createOrder = async (req, res) => {
    const { shipFee, programId, paymentId, profileId, items } = req.body;
    const accountId = req.user.accountId;

    try {
        const orderId = await exports.createOrderInternal({
            shipFee,
            programId,
            paymentId,
            profileId,
            items,
            accountId
        });

        const now = Date.now();
        const details = items.map((i, index) => ({
            orderDetailId: `OD${now}${index}`,
            orderId,
            productId: i.productId,
            classificationId: i.classificationId,
            quantity: i.quantity
        }));

        await OrderDetail.bulkCreate(details);

        res.status(201).json({ message: 'Tạo đơn hàng thành công', orderId });
    } catch (err) {
        console.error('Lỗi tạo order:', err);
        res.status(500).json({ message: 'Tạo đơn hàng thất bại' });
    }
};

// Mua ngay 1 sản phẩm (không qua giỏ hàng)
exports.buyNow = async (req, res) => {
    const { productId, paymentId, profileId, programId, shipFee } = req.body;
    const accountId = req.user.accountId;

    try {
        if (!productId || !paymentId || !profileId || !programId) {
            return res.status(400).json({ message: 'Thiếu dữ liệu bắt buộc' });
        }

        const orderId = await exports.createOrderInternal({
            shipFee: shipFee || 0,
            programId,
            paymentId,
            profileId,
            accountId,
            items: [{ productId, quantity: 1 }]
        });

        res.status(201).json({ message: 'Mua ngay thành công', orderId });
    } catch (error) {
        console.error('Buy Now Error:', error);
        res.status(500).json({ message: 'Không thể thực hiện mua ngay' });
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
    const { status, deliveryId } = req.body; // Lấy thêm deliveryId
    const accountId = req.user.accountId;    // Lấy từ token (JWT)

    try {
        const order = await Order.findByPk(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Không tìm thấy order' });
        }

        order.status = status;
        order.deliveryId = deliveryId;
        order.accountId = accountId;

        await order.save();

        res.json({
            message: 'Cập nhật trạng thái và người giao hàng thành công',
            status,
            deliveryId
        });
    } catch (err) {
        console.error('Lỗi cập nhật order:', err);
        res.status(500).json({ message: 'Lỗi cập nhật trạng thái đơn hàng' });
    }
};


exports.cancelOrder = async (req, res) => {
    const { orderId } = req.params;
    const accountId = req.user.accountId;

    try {
        const order = await Order.findByPk(orderId);

        if (!order) {
            return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
        }

        // Check quyền sở hữu đơn hàng
        if (order.accountId !== accountId) {
            return res.status(403).json({ message: 'Bạn không có quyền hủy đơn hàng này' });
        }

        // Check trạng thái có thể hủy không
        if (order.status !== 'in_transit') {
            return res.status(400).json({ message: 'Chỉ có thể hủy đơn đang giao (in_transit)' });
        }


        order.status = 'cancel';
        await order.save();

        res.json({ message: 'Đã hủy đơn hàng thành công', orderId: order.orderId });
    } catch (err) {
        console.error('Lỗi hủy đơn hàng:', err);
        res.status(500).json({ message: 'Không thể hủy đơn hàng' });
    }
};