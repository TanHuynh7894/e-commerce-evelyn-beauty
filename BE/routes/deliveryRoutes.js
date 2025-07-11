const express = require("express");
const router = express.Router();
const deliveryController = require("../controllers/delivery.controllers");
const { verifyToken } = require("../middlewares/auth");

// Lấy danh sách tỉnh/thành
router.get("/provinces", deliveryController.getProvinces);

// Lấy danh sách quận/huyện theo province_id
router.post("/districts", deliveryController.getDistricts);

// Lấy danh sách phường/xã theo district_id
router.post("/wards", deliveryController.getWards);

// Tính phí vận chuyển
router.post("/calculate-fee", deliveryController.calculateFee);

// Tính phí vận chuyển từ profile
router.post(
  "/calculate-fee-from-profile",
  verifyToken,
  deliveryController.calculateFeeFromProfile
);

// Tính phí vận chuyển từ address (test calculateFeeFromProfileV2)
router.post("/calculate-fee-v2", verifyToken, async (req, res) => {
  try {
    const { address, weight, length, width, height } = req.body;
    if (!address)
      return res.status(400).json({ success: false, message: "Thiếu address" });
    const data = await deliveryController.calculateFeeFromProfileV2(address, {
      weight,
      length,
      width,
      height,
    });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Tạo đơn hàng GHN
router.post(
  "/create-order-ghn-from-order",
  verifyToken,
  deliveryController.createOrderGhnFromOrder
);

// Lấy thông tin đơn hàng GHN
router.post("/order-info", verifyToken, deliveryController.getOrderInfo);

module.exports = router;
