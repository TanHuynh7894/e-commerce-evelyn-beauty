const { Account } = require("../models");

// Middleware kiểm tra quyền truy cập - chỉ cho phép OS và SF
const checkClassificationPermission = async (req, res, next) => {
  try {
    // Lấy thông tin user từ session hoặc token
    const user = req.user || req.session?.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Bạn cần đăng nhập để truy cập chức năng này",
      });
    }

    // Kiểm tra role của user
    const account = await Account.findOne({
      where: { accountId: user.accountId },
      attributes: ["accountId", "role"],
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông tin tài khoản",
      });
    }

    // Chỉ cho phép OS và SF truy cập
    if (account.role !== "OS" && account.role !== "SF") {
      return res.status(403).json({
        success: false,
        message:
          "Bạn không có quyền truy cập chức năng này. Chỉ OS và SF mới được phép.",
      });
    }

    // Thêm thông tin user vào request để sử dụng ở controller
    req.userInfo = {
      accountId: account.accountId,
      role: account.role,
    };

    next();
  } catch (error) {
    console.error("Error in checkClassificationPermission:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi kiểm tra quyền truy cập",
      error: error.message,
    });
  }
};

// Middleware validate classification ID
const validateClassificationId = (req, res, next) => {
  const classificationId =
    req.classificationIdFromQuery || req.params.classificationId;

  if (!classificationId || classificationId.trim() === "") {
    return res.status(400).json({
      success: false,
      message: "Classification ID không được để trống",
    });
  }

  if (classificationId.length > 20) {
    return res.status(400).json({
      success: false,
      message: "Classification ID không được vượt quá 20 ký tự",
    });
  }

  next();
};

// Middleware validate data khi tạo classification mới
const validateCreateClassification = (req, res, next) => {
  const { name } = req.body;

  // Kiểm tra tên
  if (!name || name.trim() === "") {
    return res.status(400).json({
      success: false,
      message: "Tên classification không được để trống",
    });
  }

  if (name.length > 40) {
    return res.status(400).json({
      success: false,
      message: "Tên classification không được vượt quá 40 ký tự",
    });
  }

  // Loại bỏ khoảng trắng thừa
  req.body.name = name.trim();

  next();
};

// Middleware validate data khi cập nhật classification
const validateUpdateClassification = (req, res, next) => {
  const { name } = req.body;

  // Kiểm tra tên
  if (!name || name.trim() === "") {
    return res.status(400).json({
      success: false,
      message: "Tên classification không được để trống",
    });
  }

  if (name.length > 40) {
    return res.status(400).json({
      success: false,
      message: "Tên classification không được vượt quá 40 ký tự",
    });
  }

  // Loại bỏ khoảng trắng thừa
  req.body.name = name.trim();

  next();
};

module.exports = {
  checkClassificationPermission,
  validateClassificationId,
  validateCreateClassification,
  validateUpdateClassification,
};
