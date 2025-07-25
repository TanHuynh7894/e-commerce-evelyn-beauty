// promotionPrograms.middlewares.js

// Middleware phân trang cho promotion programs
const paginate = (req, res, next) => {
  req.pagination = {
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 10,
    offset: 0,
  };
  req.pagination.offset = (req.pagination.page - 1) * req.pagination.limit;
  next();
};

// Middleware validate pagination parameters
const validatePagination = (req, res, next) => {
  const page = parseInt(req.query.page);
  const limit = parseInt(req.query.limit);

  if (page && (page < 1 || isNaN(page))) {
    return res.status(400).json({
      message: "Số trang phải là số nguyên dương",
    });
  }

  if (limit && (limit < 1 || limit > 100 || isNaN(limit))) {
    return res.status(400).json({
      message: "Số lượng items per page phải từ 1 đến 100",
    });
  }

  next();
};

// Middleware log promotion program requests (debug)
const logPromotionProgramRequest = (req, res, next) => {
  console.log(`[PromotionProgram Middleware] ${req.method} ${req.originalUrl}`);
  console.log(
    `[PromotionProgram Middleware] User: ${req.user?.accountId || "Anonymous"}`
  );
  next();
};

// Middleware validate dữ liệu tạo promotion program
const validateCreatePromotionProgram = (req, res, next) => {
  const { name, condition1, condition2, value, startDate, endDate } = req.body;

  // Validate required fields
  if (!name || name.trim().length === 0) {
    return res.status(400).json({
      message: "Tên promotion program không được để trống",
    });
  }

  if (!condition1 || condition1.trim().length === 0) {
    return res.status(400).json({
      message: "Condition1 không được để trống",
    });
  }

  // ✅ Chỉ kiểm tra value nếu được gửi lên
  if (value !== undefined && value !== null) {
    if (typeof value !== "number" || value < 0) {
      return res.status(400).json({
        message: "Value phải là số không âm",
      });
    }
  }

  if (!startDate) {
    return res.status(400).json({
      message: "startDate không được để trống",
    });
  }

  if (!endDate) {
    return res.status(400).json({
      message: "endDate không được để trống",
    });
  }

  // Validate date formats
  const startDateObj = new Date(startDate);
  const endDateObj = new Date(endDate);

  if (isNaN(startDateObj.getTime())) {
    return res.status(400).json({
      message: "startDate phải là định dạng ngày hợp lệ",
    });
  }

  if (isNaN(endDateObj.getTime())) {
    return res.status(400).json({
      message: "endDate phải là định dạng ngày hợp lệ",
    });
  }

  if (startDateObj >= endDateObj) {
    return res.status(400).json({
      message: "startDate phải nhỏ hơn endDate",
    });
  }

  // Validate max length
  if (name.length > 5000) {
    return res.status(400).json({
      message: "Tên promotion program không được vượt quá 5000 ký tự",
    });
  }

  if (condition1.length > 20) {
    return res.status(400).json({
      message: "Condition1 không được vượt quá 20 ký tự",
    });
  }

  if (condition2 && condition2.length > 20) {
    return res.status(400).json({
      message: "Condition2 không được vượt quá 20 ký tự",
    });
  }

  next();
};

// Middleware validate dữ liệu update tên promotion program
const validateUpdateName = (req, res, next) => {
  const { name } = req.body;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return res.status(400).json({
      message: "Tên promotion program không được để trống",
    });
  }

  if (name.length > 5000) {
    return res.status(400).json({
      message: "Tên promotion program không được vượt quá 5000 ký tự",
    });
  }
  next();
};

// Middleware kiểm tra promotion program có tồn tại không
const checkPromotionProgramExists = async (req, res, next) => {
  try {
    const { programId } = req.query;

    if (!programId) {
      return res.status(400).json({
        message: "Vui lòng cung cấp programId trong query parameter.",
      });
    }

    const { PromotionProgram } = require("../models");
    const promotionProgram = await PromotionProgram.findByPk(programId);

    if (!promotionProgram) {
      return res.status(404).json({
        message: "Không tìm thấy promotion program",
        programId,
      });
    }

    req.promotionProgram = promotionProgram; // Gắn program vào request
    next();
  } catch (error) {
    console.error("Lỗi middleware checkPromotionProgramExists:", error);
    res.status(500).json({
      message: "Lỗi server khi kiểm tra promotion program",
      error: error.message,
    });
  }
};

// Middleware kiểm tra promotion program có đang hoạt động không
const checkPromotionProgramActive = (req, res, next) => {
  try {
    const promotionProgram = req.promotionProgram;
    const currentDate = new Date();

    if (promotionProgram.startDate > currentDate) {
      return res.status(400).json({
        message: "Promotion program chưa bắt đầu",
        startDate: promotionProgram.startDate,
      });
    }

    if (promotionProgram.endDate < currentDate) {
      return res.status(400).json({
        message: "Promotion program đã kết thúc",
        endDate: promotionProgram.endDate,
      });
    }

    next();
  } catch (error) {
    console.error("Lỗi middleware checkPromotionProgramActive:", error);
    res.status(500).json({
      message: "Lỗi server khi kiểm tra trạng thái promotion program",
      error: error.message,
    });
  }
};

module.exports = {
  paginate,
  validatePagination,
  logPromotionProgramRequest,
  validateCreatePromotionProgram,
  validateUpdateName,
  checkPromotionProgramExists,
  checkPromotionProgramActive,
};
