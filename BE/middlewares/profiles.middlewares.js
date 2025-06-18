const { Profile } = require("../models");

//Middleware validate dữ liệu profile
const validateProfileData = (req, res, next) => {
  const { name, phone, address, gender, birthday } = req.body;

  // Nếu không có trường nào, báo lỗi
  if (!name && !phone && !address && !gender && !birthday && !req.body.image) {
    return res.status(400).json({
      message: "Phải truyền ít nhất 1 trường để cập nhật",
    });
  }

  if (name !== undefined) {
    if (
      typeof name !== "string" ||
      name.trim().length === 0 ||
      name.trim().length > 40
    ) {
      return res.status(400).json({
        message: "Tên phải là chuỗi và có độ dài từ 1-40 ký tự",
      });
    }
  }

  if (phone !== undefined) {
    if (!/^\d{10}$/.test(phone.trim())) {
      return res.status(400).json({
        message: "Số điện thoại phải có đúng 10 chữ số",
      });
    }
  }

  if (address !== undefined) {
    if (
      typeof address !== "string" ||
      address.trim().length === 0 ||
      address.trim().length > 255
    ) {
      return res.status(400).json({
        message: "Địa chỉ phải là chuỗi và có độ dài từ 1-255 ký tự",
      });
    }
  }

  if (gender !== undefined) {
    if (!["F", "M"].includes(gender)) {
      return res.status(400).json({
        message: "Gender phải là F (Female) hoặc M (Male)",
      });
    }
  }

  if (birthday !== undefined) {
    const birthdayDate = new Date(birthday);
    const today = new Date();
    if (isNaN(birthdayDate.getTime())) {
      return res.status(400).json({
        message: "Ngày sinh không hợp lệ",
      });
    }
    if (birthdayDate > today) {
      return res.status(400).json({
        message: "Ngày sinh không thể trong tương lai",
      });
    }
    const age = today.getFullYear() - birthdayDate.getFullYear();
    const monthDiff = today.getMonth() - birthdayDate.getMonth();
    if (age < 13 || (age === 13 && monthDiff < 0)) {
      return res.status(400).json({
        message: "Bạn phải ít nhất 13 tuổi để tạo profile",
      });
    }
  }

  // Validate image URL nếu có
  if (req.body.image) {
    try {
      const url = new URL(req.body.image);
      if (!["http:", "https:"].includes(url.protocol)) {
        return res.status(400).json({
          message: "URL hình ảnh phải sử dụng HTTP hoặc HTTPS",
        });
      }
    } catch (error) {
      return res.status(400).json({
        message: "URL hình ảnh không hợp lệ",
      });
    }
  }

  // Clean và format dữ liệu
  req.body.name = name ? name.trim() : undefined;
  req.body.phone = phone ? phone.trim() : undefined;
  req.body.address = address ? address.trim() : undefined;
  if (birthday !== undefined) {
    const birthdayDate = new Date(birthday);
    req.body.birthday = birthdayDate;
  } else {
    req.body.birthday = undefined;
  }
  req.body.image = req.body.image || null;

  next();
};

// Middleware kiểm tra profile đã tồn tại
const checkProfileExists = async (req, res, next) => {
  try {
    const { accountId } = req.user;

    const existingProfile = await Profile.findOne({
      where: { accountId },
    });

    if (existingProfile) {
      return res.status(409).json({
        message: "Đã có profile cho tài khoản này",
        profileId: existingProfile.profileId,
      });
    }

    next();
  } catch (error) {
    console.error("Lỗi kiểm tra profile tồn tại:", error);
    return res.status(500).json({
      message: "Lỗi server khi kiểm tra profile",
    });
  }
};

//Middleware kiểm tra profile chưa tồn tại (cho update/delete)
const checkProfileNotExists = async (req, res, next) => {
  try {
    const { accountId } = req.user;

    const profile = await Profile.findOne({
      where: { accountId },
    });

    if (!profile) {
      return res.status(404).json({
        message: "Không tìm thấy profile. Vui lòng tạo profile trước.",
      });
    }

    // Thêm profile vào request để sử dụng trong controller
    req.profile = profile;
    next();
  } catch (error) {
    console.error("Lỗi kiểm tra profile không tồn tại:", error);
    return res.status(500).json({
      message: "Lỗi server khi kiểm tra profile",
    });
  }
};

//Middleware kiểm tra quyền truy cập profile
const checkProfileAccess = async (req, res, next) => {
  try {
    const { accountId, role } = req.user;
    const { profileId } = req.params;

    // Nếu có profileId trong params, kiểm tra quyền truy cập
    if (profileId) {
      const profile = await Profile.findOne({
        where: { profileId },
      });

      if (!profile) {
        return res.status(404).json({
          message: "Không tìm thấy profile",
        });
      }

      // Chỉ cho phép truy cập profile của chính mình
      if (profile.accountId !== accountId) {
        return res.status(403).json({
          message: "Bạn chỉ có thể truy cập profile của chính mình",
        });
      }

      req.profile = profile;
    }

    next();
  } catch (error) {
    console.error("Lỗi kiểm tra quyền truy cập profile:", error);
    return res.status(500).json({
      message: "Lỗi server khi kiểm tra quyền truy cập",
    });
  }
};

// Middleware sanitize dữ liệu profile
const sanitizeProfileData = (req, res, next) => {
  // Loại bỏ các ký tự đặc biệt và HTML tags
  const sanitizeString = (str) => {
    if (typeof str !== "string") return str;
    return str
      .replace(/[<>]/g, "") // Loại bỏ < >
      .replace(/&/g, "&amp;") // Escape &
      .replace(/"/g, "&quot;") // Escape "
      .replace(/'/g, "&#x27;") // Escape '
      .replace(/\//g, "&#x2F;"); // Escape /
  };

  if (req.body.name) {
    req.body.name = sanitizeString(req.body.name);
  }

  if (req.body.address) {
    req.body.address = sanitizeString(req.body.address);
  }

  if (req.body.phone) {
    // Chỉ giữ lại số
    req.body.phone = req.body.phone.replace(/\D/g, "");
  }

  next();
};

// Middleware validate phone number format
const validatePhoneFormat = (req, res, next) => {
  const { phone } = req.body;

  if (phone) {
    // Kiểm tra định dạng số điện thoại Việt Nam
    const phoneRegex =
      /^(0|\+84)(3[2-9]|5[689]|7[06-9]|8[1-689]|9[0-46-9])[0-9]{7}$/;

    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        message: "Số điện thoại không đúng định dạng số Việt Nam",
      });
    }
  }

  next();
};

// Middleware rate limiting cho profile operations
const profileRateLimit = (req, res, next) => {
  // Simple rate limiting - có thể mở rộng với Redis
  const clientIP = req.ip || req.connection.remoteAddress;
  const now = Date.now();

  // Giới hạn 10 requests/phút cho mỗi IP
  if (!req.app.locals.rateLimit) {
    req.app.locals.rateLimit = {};
  }

  if (!req.app.locals.rateLimit[clientIP]) {
    req.app.locals.rateLimit[clientIP] = {
      count: 0,
      resetTime: now + 60000, // 1 phút
    };
  }

  const rateLimit = req.app.locals.rateLimit[clientIP];

  if (now > rateLimit.resetTime) {
    rateLimit.count = 0;
    rateLimit.resetTime = now + 60000;
  }

  rateLimit.count++;

  if (rateLimit.count > 10) {
    return res.status(429).json({
      message: "Quá nhiều yêu cầu. Vui lòng thử lại sau 1 phút.",
    });
  }

  next();
};

module.exports = {
  validateProfileData,
  checkProfileExists,
  checkProfileNotExists,
  checkProfileAccess,
  sanitizeProfileData,
  validatePhoneFormat,
  profileRateLimit,
};
