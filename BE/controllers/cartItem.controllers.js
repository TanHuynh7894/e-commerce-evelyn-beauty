const {
  CartItem,
  Product,
  Cart,
  Classification,
  ClassificationProduct,
} = require("../models");

// Lấy tất cả cart items của khách hàng hiện tại
exports.getAllCartItems = async (req, res) => {
  try {
    // Kiểm tra xác thực
    if (!req.user || !req.user.accountId) {
      return res
        .status(401)
        .json({ message: "Chưa đăng nhập hoặc thiếu thông tin tài khoản" });
    }
    // Lấy cartId của khách hàng hiện tại
    const cart = await Cart.findOne({
      where: { accountId: req.user.accountId },
    });
    if (!cart) {
      return res.status(404).json({ message: "Khách hàng chưa có giỏ hàng" });
    }
    const cartItems = await CartItem.findAll({
      where: { cartId: cart.cartId, status: "ON" },
      include: [
        {
          model: Product,
          as: "product",
          attributes: ["productId", "name", "price", "image_1"],
        },
        {
          model: Classification,
          as: "classification",
          attributes: ["classificationId", "name"],
        },
      ],
    });
    // Định dạng lại kết quả trả về
    const baseUrl = req.protocol + "://" + req.get("host");
    const result = cartItems.map((item) => ({
      product: item.product
        ? {
            productId: item.product?.productId,
            name: item.product?.name,
            price: item.product?.price,
            image:
              item.product?.image_1 &&
              item.product?.image_1.startsWith("/public/products/")
                ? `${baseUrl}${item.product.image_1}`
                : item.product?.image_1,
          }
        : null,
      classification: item.classification
        ? {
            classificationId: item.classification.classificationId,
            name: item.classification.name,
          }
        : null,
      quantity: item.quantity,
    }));
    res.json({ product: result });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server khi lấy cart items", error });
  }
};

// Thêm cart item
exports.createCartItem = async (req, res) => {
  const { cartId, productId, classificationId, quantity } = req.body;
  try {
    const [cartItem, created] = await CartItem.findOrCreate({
      where: { cartId, productId, classificationId },
      defaults: { quantity, status: "ON" },
    });
    if (!created) {
      if (cartItem.status === "OFF") {
        cartItem.status = "ON";
        cartItem.quantity = quantity;
      } else {
        cartItem.quantity += quantity;
      }
      await cartItem.save();
    }
    // Lấy lại cartItem kèm thông tin product, classification và classificationForProduct
    const itemWithDetails = await CartItem.findOne({
      where: { cartId, productId, classificationId },
      include: [
        {
          model: Product,
          as: "product",
          attributes: ["productId", "name", "price", "image_1"],
        },
        {
          model: Classification,
          as: "classification",
          attributes: ["classificationId", "name"],
        },
      ],
    });
    // Định dạng trả về giống getAllCartItems
    const result = {
      product: {
        productId: itemWithDetails.product?.productId,
        name: itemWithDetails.product?.name,
        price: itemWithDetails.product?.price,
        image: itemWithDetails.product?.image_1,
      },
      classification: itemWithDetails.classification
        ? {
            classificationId: itemWithDetails.classification.classificationId,
            name: itemWithDetails.classification.name,
          }
        : null,
      quantity: itemWithDetails.quantity,
    };
    res.status(created ? 201 : 200).json(result);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server khi thêm cart item", error });
  }
};

// Cập nhật số lượng cart item
exports.updateCartItem = async (req, res) => {
  const { cartId, productId, classificationId, quantity } = req.body;
  try {
    const cartItem = await CartItem.findOne({
      where: { cartId, productId, classificationId },
    });
    if (!cartItem)
      return res.status(404).json({ message: "Không tìm thấy cart item" });
    if (cartItem.status !== "ON") {
      return res
        .status(400)
        .json({
          message:
            "Sản phẩm này hiện không khả dụng trong giỏ hàng, bạn không thể thay đổi số lượng.",
        });
    }
    cartItem.quantity = quantity;
    await cartItem.save();

    // Lấy lại cartItem kèm thông tin product, classification và classificationForProduct
    const itemWithDetails = await CartItem.findOne({
      where: { cartId, productId, classificationId },
      include: [
        {
          model: Product,
          as: "product",
          attributes: ["productId", "name", "price", "image_1"],
        },
        {
          model: Classification,
          as: "classification",
          attributes: ["classificationId", "name"],
        },
      ],
    });
    // Định dạng trả về giống các API khác
    const result = {
      product: {
        productId: itemWithDetails.product?.productId,
        name: itemWithDetails.product?.name,
        price: itemWithDetails.product?.price,
        image: itemWithDetails.product?.image_1,
      },
      classification: itemWithDetails.classification
        ? {
            classificationId: itemWithDetails.classification.classificationId,
            name: itemWithDetails.classification.name,
          }
        : null,
      quantity: itemWithDetails.quantity,
    };
    res.json(result);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Lỗi server khi cập nhật cart item", error });
  }
};

// Xóa cart item
exports.deleteCartItem = async (req, res) => {
  const { cartId, productId, classificationId } = req.body;
  try {
    // Kiểm tra quyền sở hữu cart
    const cart = await Cart.findOne({ where: { cartId } });
    if (!cart || cart.accountId !== req.user.accountId) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền xóa cart item này!" });
    }
    const cartItem = await CartItem.findOne({
      where: { cartId, productId, classificationId },
    });
    if (!cartItem)
      return res
        .status(404)
        .json({ message: "Không tìm thấy cart item để xóa" });
    await cartItem.destroy();
    res.json({ message: "Sản phẩm đã được xóa khỏi giỏ hàng của bạn." });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server khi xóa cart item", error });
  }
};
// Lấy tất cả cart items đã thanh toán (status = 'OFF') của khách hàng hiện tại
exports.getAllPaidCartItems = async (req, res) => {
  try {
    // Kiểm tra xác thực
    if (!req.user || !req.user.accountId) {
      return res
        .status(401)
        .json({ message: "Chưa đăng nhập hoặc thiếu thông tin tài khoản" });
    }
    // Lấy cartId của khách hàng hiện tại
    const cart = await Cart.findOne({
      where: { accountId: req.user.accountId },
    });
    if (!cart) {
      return res.status(404).json({ message: "Khách hàng chưa có giỏ hàng" });
    }
    const cartItems = await CartItem.findAll({
      where: { cartId: cart.cartId, status: "OFF" },
      include: [
        {
          model: Product,
          as: "product",
          attributes: ["productId", "name", "price", "image_1"],
        },
        {
          model: Classification,
          as: "classification",
          attributes: ["classificationId", "name"],
        },
      ],
    });
    // Định dạng lại kết quả trả về
    const result = cartItems.map((item) => ({
      product: item.product
        ? {
            productId: item.product?.productId,
            name: item.product?.name,
            price: item.product?.price,
            image: item.product?.image_1,
          }
        : null,
      classification: item.classification
        ? {
            classificationId: item.classification.classificationId,
            name: item.classification.name,
          }
        : null,
      quantity: item.quantity,
    }));
    res.json({ paidProducts: result });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Lỗi server khi lấy cart items đã thanh toán", error });
  }
};
