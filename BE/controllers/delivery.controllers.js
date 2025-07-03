const axios = require("axios");

const ghn = axios.create({
  baseURL: "https://online-gateway.ghn.vn/shiip/public-api",
  headers: {
    Token: process.env.GHN_TOKEN,
    ShopId: process.env.GHN_SHOP_ID,
    "Content-Type": "application/json",
  },
});

module.exports = {
  // Lấy danh sách tỉnh/thành
  async getProvinces(req, res) {
    try {
      const response = await ghn.get("/master-data/province");
      res.json({ success: true, data: response.data.data });
    } catch (error) {
      console.error(
        "GHN getProvinces error:",
        error?.response?.data || error.message
      );
      res.status(500).json({
        success: false,
        message: "Lỗi lấy danh sách tỉnh/thành",
        error: error?.response?.data || error.message,
      });
    }
  },

  // Lấy danh sách quận/huyện theo provinceID
  async getDistricts(req, res) {
    const { province_id } = req.body;
    if (!province_id)
      return res
        .status(400)
        .json({ success: false, message: "Thiếu province_id" });
    try {
      const response = await ghn.post("/master-data/district", { province_id });
      res.json({ success: true, data: response.data.data });
    } catch (error) {
      console.error(
        "GHN getDistricts error:",
        error?.response?.data || error.message
      );
      res.status(500).json({
        success: false,
        message: "Lỗi lấy danh sách quận/huyện",
        error: error?.response?.data || error.message,
      });
    }
  },

  // Lấy danh sách phường/xã theo districtID
  async getWards(req, res) {
    const { district_id } = req.body;
    if (!district_id)
      return res
        .status(400)
        .json({ success: false, message: "Thiếu district_id" });
    try {
      const response = await ghn.post("/master-data/ward", { district_id });
      res.json({ success: true, data: response.data.data });
    } catch (error) {
      console.error(
        "GHN getWards error:",
        error?.response?.data || error.message
      );
      res.status(500).json({
        success: false,
        message: "Lỗi lấy danh sách phường/xã",
        error: error?.response?.data || error.message,
      });
    }
  },

  // Tính phí vận chuyển
  async calculateFee(req, res) {
    const { toDistrict, toWard, weight = 500 } = req.body;
    if (!toDistrict || !toWard)
      return res
        .status(400)
        .json({ success: false, message: "Thiếu toDistrict hoặc toWard" });
    try {
      const response = await ghn.post("/v2/shipping-order/fee", {
        service_id: 53320, // Cần điều chỉnh đúng dịch vụ bạn đăng ký
        insurance_value: 1000000,
        from_district_id: 1454, // Cần điều chỉnh đúng kho gửi
        to_district_id: toDistrict,
        to_ward_code: toWard,
        weight,
        length: 10,
        width: 10,
        height: 10,
      });
      res.json({ success: true, data: response.data.data });
    } catch (error) {
      console.error(
        "GHN calculateFee error:",
        error?.response?.data || error.message
      );
      res.status(500).json({
        success: false,
        message: "Lỗi tính phí vận chuyển",
        error: error?.response?.data || error.message,
      });
    }
  },

  // Tạo đơn hàng GHN
  async createOrder(req, res) {
    const orderData = req.body;
    try {
      const response = await ghn.post("/v2/shipping-order/create", orderData);
      res.json({ success: true, data: response.data.data });
    } catch (error) {
      console.error(
        "GHN createOrder error:",
        error?.response?.data || error.message
      );
      res.status(500).json({
        success: false,
        message: "Lỗi tạo đơn hàng",
        error: error?.response?.data || error.message,
      });
    }
  },

  // Lấy thông tin đơn hàng GHN
  async getOrderInfo(req, res) {
    const { order_code } = req.body;
    if (!order_code)
      return res
        .status(400)
        .json({ success: false, message: "Thiếu order_code" });
    try {
      const response = await ghn.post("/v2/shipping-order/detail", {
        order_code,
      });
      res.json({ success: true, data: response.data.data });
    } catch (error) {
      console.error(
        "GHN getOrderInfo error:",
        error?.response?.data || error.message
      );
      res.status(500).json({
        success: false,
        message: "Lỗi lấy thông tin đơn hàng",
        error: error?.response?.data || error.message,
      });
    }
  },

  // Tính phí vận chuyển từ profile được chọn
  async calculateFeeFromProfile(req, res) {
    const {
      profileId,
      weight = 500,
      length = 10,
      width = 10,
      height = 10,
    } = req.body;
    const accountId = req.user?.accountId;

    if (!accountId)
      return res
        .status(400)
        .json({ success: false, message: "Thiếu accountId" });
    if (!profileId)
      return res
        .status(400)
        .json({ success: false, message: "Thiếu profileId" });

    try {
      const { Profile } = require("../models");
      const profile = await Profile.findOne({
        where: { profileId, accountId, status: "ON" },
      });

      if (!profile || !profile.address) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy profile hoặc địa chỉ",
        });
      }

      function parseAddressByComma(address) {
        const parts = address
          .split(",")
          .map((p) => p.trim())
          .filter(Boolean);
        const n = parts.length;
        return {
          detail: parts[0] || "",
          ward: parts[n - 3] || "",
          district: parts[n - 2] || "",
          province: parts[n - 1] || "",
        };
      }

      function removeVietnameseTones(str) {
        return str
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/đ/g, "d")
          .replace(/Đ/g, "D")
          .replace(/\s+/g, " ")
          .trim();
      }

      function normalizeText(str) {
        if (!str) return "";
        str = str.toLowerCase();
        str = str.replace(
          /^(tp|tinh|thanh pho|quan|huyen|thi xa|phuong|xa)\.?\s*/gi,
          ""
        );
        str = str.replace(/\./g, "").trim();
        return removeVietnameseTones(str);
      }

      const parsed = parseAddressByComma(profile.address);
      console.log("parsed:", parsed);

      if (!parsed.province || !parsed.district || !parsed.ward) {
        return res.status(400).json({
          success: false,
          message:
            "Địa chỉ profile phải có đủ tỉnh/thành, quận/huyện, phường/xã!",
          parsed,
        });
      }

      // 1. Tìm province
      const provincesRes = await ghn.get("/master-data/province");
      const provinces = provincesRes.data.data;
      const parsedProvinceNorm = normalizeText(parsed.province);

      const province = provinces.find((p) => {
        const pNorm = normalizeText(p.ProvinceName);
        return (
          pNorm === parsedProvinceNorm ||
          pNorm.includes(parsedProvinceNorm) ||
          parsedProvinceNorm.includes(pNorm)
        );
      });

      if (!province) {
        return res.status(400).json({
          success: false,
          message: "Không tìm thấy tỉnh/thành phù hợp với địa chỉ!",
          parsedProvince: parsed.province,
        });
      }

      // 2. Tìm district
      const districtsRes = await ghn.post("/master-data/district", {
        province_id: province.ProvinceID,
      });
      const districts = districtsRes.data.data;
      const parsedDistrictNorm = normalizeText(parsed.district);

      const district = districts.find((d) => {
        const dNorm = normalizeText(d.DistrictName);
        return (
          dNorm === parsedDistrictNorm ||
          dNorm.includes(parsedDistrictNorm) ||
          parsedDistrictNorm.includes(dNorm)
        );
      });

      if (!district) {
        return res.status(400).json({
          success: false,
          message: "Không tìm thấy quận/huyện phù hợp với địa chỉ!",
          parsedDistrict: parsed.district,
        });
      }

      // 3. Tìm ward
      const wardsRes = await ghn.post("/master-data/ward", {
        district_id: district.DistrictID,
      });
      const wards = wardsRes.data.data;
      const parsedWardNorm = normalizeText(parsed.ward);

      const ward = wards.find((w) => {
        const wNorm = normalizeText(w.WardName);
        return (
          wNorm === parsedWardNorm ||
          wNorm.includes(parsedWardNorm) ||
          parsedWardNorm.includes(wNorm)
        );
      });

      if (!ward) {
        return res.status(400).json({
          success: false,
          message: "Không tìm thấy phường/xã phù hợp với địa chỉ!",
          parsedWard: parsed.ward,
        });
      }

      // 4. Lấy dịch vụ giao hàng
      const availableServicesRes = await ghn.post(
        "/v2/shipping-order/available-services",
        {
          shop_id: parseInt(process.env.GHN_SHOP_ID),
          from_district: 1454,
          to_district: district.DistrictID,
        }
      );

      const services = availableServicesRes.data.data;
      if (!services || services.length === 0)
        throw new Error("Không có dịch vụ giao hàng phù hợp");

      const service_id = services[0].service_id;

      // 5. Gọi tính phí tiền
      const feeRes = await ghn.post("/v2/shipping-order/fee", {
        service_id,
        insurance_value: 1000000,
        from_district_id: 1454,
        to_district_id: district.DistrictID,
        to_ward_code: ward.WardCode,
        weight,
        length,
        width,
        height,
      });

      res.json({ success: true, data: feeRes.data.data });
    } catch (error) {
      console.error(
        "calculateFeeFromProfile error:",
        error?.response?.data || error.message
      );
      res.status(500).json({
        success: false,
        message: "Lỗi tính phí vận chuyển",
        error: error?.response?.data || error.message,
      });
    }
  },

  // Tạo đơn hàng GHN từ profile được chọn
  async createOrderGhnFromOrder(req, res) {
    const { orderId } = req.body;
    const accountId = req.user?.accountId;

    if (!accountId)
      return res
        .status(400)
        .json({ success: false, message: "Thiếu accountId" });
    if (!orderId)
      return res.status(400).json({ success: false, message: "Thiếu orderId" });

    try {
      const { Order, Profile, OrderDetail, Product } = require("../models");

      const order = await Order.findOne({ where: { orderId, accountId } });
      if (!order)
        return res
          .status(404)
          .json({ success: false, message: "Không tìm thấy order" });

      const profile = await Profile.findOne({
        where: { profileId: order.profileId, accountId, status: "ON" },
      });
      if (!profile || !profile.address)
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy profile hoặc địa chỉ",
        });

      const orderDetails = await OrderDetail.findAll({ where: { orderId } });

      const note = order.note || req.body.note || "";
      const required_note =
        order.required_note || req.body.required_note || "KHONGCHOXEMHANG";
      const weight = order.weight || req.body.weight || 500;
      const to_name = profile.name || req.body.to_name || "";
      const to_phone = profile.phone || req.body.to_phone || "";

      let items = [];
      if (orderDetails.length > 0) {
        for (const detail of orderDetails) {
          const product = await Product.findOne({
            where: { productId: detail.productId },
          });
          items.push({
            name: product ? product.name : "Sản phẩm",
            quantity: detail.quantity,
          });
        }
      } else if (req.body.items && Array.isArray(req.body.items)) {
        items = req.body.items;
      }

      function parseAddressByComma(address) {
        const parts = address
          .split(",")
          .map((p) => p.trim())
          .filter(Boolean);
        const n = parts.length;
        return {
          detail: parts[0] || "",
          ward: parts[n - 3] || "",
          district: parts[n - 2] || "",
          province: parts[n - 1] || "",
        };
      }

      function removeVietnameseTones(str) {
        return str
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/đ/g, "d")
          .replace(/Đ/g, "D")
          .replace(/\s+/g, " ")
          .trim();
      }

      function normalizeText(str) {
        if (!str) return "";
        str = str.toLowerCase();
        str = str.replace(
          /^(tp|tinh|thanh pho|quan|huyen|thi xa|phuong|xa)\.?\s*/gi,
          ""
        );
        str = str.replace(/\./g, "").trim();
        return removeVietnameseTones(str);
      }

      const parsed = parseAddressByComma(profile.address);
      console.log("parsed:", parsed);

      if (!parsed.province || !parsed.district || !parsed.ward) {
        return res.status(400).json({
          success: false,
          message:
            "Địa chỉ profile phải có đủ tỉnh/thành, quận/huyện, phường/xã!",
          parsed,
        });
      }

      const provincesRes = await ghn.get("/master-data/province");
      const provinces = provincesRes.data.data;

      const parsedProvinceNorm = normalizeText(parsed.province);
      const province = provinces.find((p) => {
        const provinceNorm = normalizeText(p.ProvinceName);
        return (
          provinceNorm === parsedProvinceNorm ||
          provinceNorm.includes(parsedProvinceNorm) ||
          parsedProvinceNorm.includes(provinceNorm)
        );
      });

      if (!province)
        return res.status(400).json({
          success: false,
          message: "Không tìm thấy tỉnh/thành phù hợp với địa chỉ!",
          parsedProvince: parsed.province,
        });

      const districtsRes = await ghn.post("/master-data/district", {
        province_id: province.ProvinceID,
      });
      const districts = districtsRes.data.data;

      const parsedDistrictNorm = normalizeText(parsed.district);
      const district = districts.find((d) => {
        const districtNorm = normalizeText(d.DistrictName);
        return (
          districtNorm === parsedDistrictNorm ||
          districtNorm.includes(parsedDistrictNorm) ||
          parsedDistrictNorm.includes(districtNorm)
        );
      });

      if (!district)
        return res.status(400).json({
          success: false,
          message: "Không tìm thấy quận/huyện phù hợp với địa chỉ!",
          parsedDistrict: parsed.district,
        });

      const wardsRes = await ghn.post("/master-data/ward", {
        district_id: district.DistrictID,
      });
      const wards = wardsRes.data.data;

      const parsedWardNorm = normalizeText(parsed.ward);
      const ward = wards.find((w) => {
        const wardNorm = normalizeText(w.WardName);
        return (
          wardNorm === parsedWardNorm ||
          wardNorm.includes(parsedWardNorm) ||
          parsedWardNorm.includes(wardNorm)
        );
      });

      if (!ward)
        return res.status(400).json({
          success: false,
          message: "Không tìm thấy phường/xã phù hợp với địa chỉ!",
          parsedWard: parsed.ward,
        });

      const availableServicesRes = await ghn.post(
        "/v2/shipping-order/available-services",
        {
          shop_id: parseInt(process.env.GHN_SHOP_ID),
          from_district: 1454,
          to_district: district.DistrictID,
        }
      );
      const services = availableServicesRes.data.data;

      if (!services || services.length === 0)
        throw new Error("Không có dịch vụ giao hàng phù hợp");

      const service_id = services[0].service_id;

      const orderData = {
        payment_type_id: 2,
        note,
        required_note,
        to_name,
        to_phone,
        to_address: parsed.detail,
        to_ward_code: ward.WardCode,
        to_district_id: district.DistrictID,
        weight,
        length: 10,
        width: 10,
        height: 10,
        service_id,
        service_type_id: 2,
        items: items.length > 0 ? items : [{ name: "Sản phẩm", quantity: 1 }],
      };

      const response = await ghn.post("/v2/shipping-order/create", orderData);

      console.log("GHN mapping:", {
        provinceName: province.ProvinceName,
        provinceId: province.ProvinceID,
        districtName: district.DistrictName,
        districtId: district.DistrictID,
        wardName: ward.WardName,
        wardCode: ward.WardCode,
        to_address: parsed.detail,
      });

      res.json({ success: true, data: response.data.data });
    } catch (error) {
      console.error(
        "createOrderGhnFromOrder error:",
        error?.response?.data || error.message
      );
      res.status(500).json({
        success: false,
        message: "Lỗi tạo đơn hàng GHN từ order",
        error: error?.response?.data || error.message,
      });
    }
  },
};
