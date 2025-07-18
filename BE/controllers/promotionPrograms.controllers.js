const { PromotionProgram, Account, Order } = require("../models");
const { Op } = require("sequelize");

exports.getActivePromotionPrograms = async (req, res) => {
  try {
    const currentDate = new Date();
    const { page, limit, offset } = req.pagination;
    const items = req.body.items || [];
    const { Product, PromotionProgram } = require("../models");
    const { Op } = require("sequelize");

    // Tính tổng amount từ items
    let amount = 0;
    if (Array.isArray(items) && items.length > 0) {
      const productIds = items.map((i) => i.productId);
      const products = await Product.findAll({
        where: { productId: productIds },
        attributes: ["productId", "price"],
      });

      const priceMap = {};
      products.forEach((p) => {
        priceMap[p.productId] = Number(p.price);
      });

      amount = items.reduce((sum, i) => {
        const price = priceMap[i.productId] || 0;
        return sum + price * (i.quantity || 1);
      }, 0);
    }

    // Lấy promotion programs còn hiệu lực và đang bật
    const { count, rows: promotionPrograms } = await PromotionProgram.findAndCountAll({
      where: {
        startDate: { [Op.lte]: currentDate },
        endDate: { [Op.gte]: currentDate },
        status: "ON",
      },
      limit,
      offset,
      order: [["startDate", "DESC"]],
    });

    // Loại bỏ program có ID 'PG000'
    const filteredPromos = promotionPrograms.filter(promo => promo.programId !== "PG000");

    // Lọc theo điều kiện
    const currentDay = currentDate.getDay(); // 0 = Sunday

    const validPromos = filteredPromos.filter((promo) => {
      const hasCondition1 = promo.condition1 !== null && promo.condition1 !== undefined;
      const hasCondition2 = promo.condition2 !== null && promo.condition2 !== undefined;

      const validCondition1 = hasCondition1 ? amount >= promo.condition1 : true;
      const validCondition2 = hasCondition2
        ? promo.condition2.split(",").map(Number).includes(currentDay)
        : true;

      const noConditions = !hasCondition1 && !hasCondition2;

      return noConditions || (validCondition1 && validCondition2);
    });

    // Trả kết quả
    res.json({
      message: "Lấy danh sách promotion programs đang hoạt động thành công",
      data: {
        promotionPrograms: validPromos,
        pagination: {
          total: validPromos.length,
          page,
          limit,
          totalPages: Math.ceil(validPromos.length / limit),
        },
        amount,
      },
    });
  } catch (error) {
    console.error("Lỗi khi lấy promotion programs đang hoạt động:", error);
    res.status(500).json({
      message: "Lỗi server khi lấy danh sách promotion programs đang hoạt động",
      error: error.message,
    });
  }
};


// Lấy tất cả promotion programs có status ON (cho role OS)
exports.getOnPromotionProgramsForOS = async (req, res) => {
  try {
    const { page, limit, offset } = req.pagination;

    const { count, rows: promotionPrograms } =
      await PromotionProgram.findAndCountAll({
        where: {
          status: "ON",
        },
        limit,
        offset,
        order: [["startDate", "DESC"]],
      });

    res.json({
      message: "Lấy danh sách promotion programs có status 'ON' thành công",
      data: {
        promotionPrograms,
        pagination: {
          total: count,
          page,
          limit,
          totalPages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    console.error("Lỗi khi lấy ON promotion programs:", error);
    res.status(500).json({
      message: "Lỗi server khi lấy ON promotion programs",
      error: error.message,
    });
  }
};

// Update tên promotion program (cho role OS)
exports.updatePromotionProgramName = async (req, res) => {
  try {
    const { name } = req.body;
    const promotionProgram = req.promotionProgram; // Lấy từ middleware checkPromotionProgramExists

    promotionProgram.name = name;
    await promotionProgram.save();

    res.json({
      message: "Cập nhật tên promotion program thành công",
      data: promotionProgram,
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật tên promotion program:", error);
    res.status(500).json({
      message: "Lỗi server khi cập nhật tên promotion program",
      error: error.message,
    });
  }
};

// Soft delete promotion program (set status to OFF for role OS)
exports.softDeletePromotionProgram = async (req, res) => {
  try {
    const promotionProgram = req.promotionProgram; // from checkPromotionProgramExists middleware

    // Kiểm tra xem có đơn hàng nào dùng chương trình khuyến mãi này không
    const hasOrder = await Order.findOne({
      where: { programId: promotionProgram.programId },
    });

    if (hasOrder) {
      // Nếu có liên kết với đơn hàng → chỉ set status = 'OFF'
      if (promotionProgram.status === "OFF") {
        return res.status(400).json({
          message: "Chương trình khuyến mãi này đã được tắt từ trước.",
        });
      }

      promotionProgram.status = "OFF";
      await promotionProgram.save();

      return res.json({
        message:
          "Tắt chương trình khuyến mãi thành công (vì có đơn hàng liên quan)",
        data: promotionProgram,
      });
    }

    // Nếu không có liên kết với đơn hàng → xóa vĩnh viễn
    await promotionProgram.destroy();
    return res.json({
      message:
        "Xóa vĩnh viễn chương trình khuyến mãi thành công (không liên quan đơn hàng)",
    });
  } catch (error) {
    console.error("Lỗi khi xử lý chương trình khuyến mãi:", error);
    res.status(500).json({
      message: "Lỗi server khi xử lý chương trình khuyến mãi",
      error: error.message,
    });
  }
};

// Tạo mới promotion program (cho role OS - Owner/Staff)
exports.createPromotionProgram = async (req, res) => {
  try {
    const { name, condition1, condition2, value, startDate, endDate } =
      req.body;
    const accountId = req.user.accountId; // Lấy accountId của người tạo từ JWT token

    // Validate required fields
    if (
      !name ||
      !condition1 ||
      value === undefined ||
      value === null ||
      !startDate ||
      !endDate
    ) {
      return res.status(400).json({
        message:
          "Các trường name, condition1, value, startDate, endDate không được để trống",
      });
    }

    // Validate value
    if (typeof value !== "number" || value <= 0) {
      return res.status(400).json({
        message: "Value phải là số dương",
      });
    }

    // Validate dates
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    const currentDate = new Date();

    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      return res.status(400).json({
        message: "startDate và endDate phải là định dạng ngày hợp lệ",
      });
    }

    if (startDateObj >= endDateObj) {
      return res.status(400).json({
        message: "startDate phải nhỏ hơn endDate",
      });
    }

    // Generate programId (format: PROMO + timestamp)
    const timestamp = Date.now();
    const programId = `PROMO${timestamp}`;

    // Tạo promotion program mới
    const newPromotionProgram = await PromotionProgram.create({
      programId,
      name,
      condition1,
      condition2: condition2 || null, // condition2 có thể null
      value,
      startDate: startDateObj,
      endDate: endDateObj,
      accountId,
      status: "ON", // Mặc định status là ON
    });

    // Xác định loại giảm giá
    const discountType = value < 1 ? "Phần trăm" : "Số tiền cố định";
    const discountValue =
      value < 1
        ? `${(value * 100).toFixed(0)}%`
        : `${value.toLocaleString()} VNĐ`;

    res.status(201).json({
      message: "Tạo promotion program thành công",
      data: {
        promotionProgram: newPromotionProgram,
        discountInfo: {
          type: discountType,
          value: discountValue,
        },
      },
    });
  } catch (error) {
    console.error("Lỗi khi tạo promotion program:", error);
    res.status(500).json({
      message: "Lỗi server khi tạo promotion program",
      error: error.message,
    });
  }
};
