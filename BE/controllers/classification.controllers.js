const { Classification, ClassificationProduct } = require("../models");
const { Op } = require("sequelize");

// Lấy tất cả classification có status ON
const getAllClassifications = async (req, res) => {
  try {
    const classifications = await Classification.findAll({
      where: {
        status: "ON",
      },
      attributes: ["classificationId", "name", "status"],
      order: [["name", "ASC"]],
    });

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách classification thành công",
      data: classifications,
    });
  } catch (error) {
    console.error("Error in getAllClassifications:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách classification",
      error: error.message,
    });
  }
};

// Lấy classification theo ID
const getClassificationById = async (req, res) => {
  try {
    const { classificationId } = req.params;

    const classification = await Classification.findOne({
      where: {
        classificationId: classificationId,
        status: "ON",
      },
      attributes: ["classificationId", "name", "status"],
    });

    if (!classification) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy classification",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Lấy thông tin classification thành công",
      data: classification,
    });
  } catch (error) {
    console.error("Error in getClassificationById:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy thông tin classification",
      error: error.message,
    });
  }
};

// Tạo classification mới
const createClassification = async (req, res) => {
  try {
    const { name } = req.body;

    // Kiểm tra xem tên đã tồn tại chưa
    const existingName = await Classification.findOne({
      where: { name: name },
    });

    if (existingName) {
      return res.status(400).json({
        success: false,
        message: "Tên classification đã tồn tại",
      });
    }

    // Tự động tạo classificationId
    const generateClassificationId = () => {
      return `CL${Date.now()}`;
    };

    const classificationId = generateClassificationId();

    // Tạo classification mới
    const newClassification = await Classification.create({
      classificationId: classificationId,
      name: name,
      status: "ON", // Mặc định status là ON
    });

    return res.status(201).json({
      success: true,
      message: "Tạo classification thành công",
      data: {
        classificationId: newClassification.classificationId,
        name: newClassification.name,
        status: newClassification.status,
      },
    });
  } catch (error) {
    console.error("Error in createClassification:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi tạo classification",
      error: error.message,
    });
  }
};

// Cập nhật classification
const updateClassification = async (req, res) => {
  try {
    const classificationId =
      req.classificationIdFromQuery || req.params.classificationId;
    const { name } = req.body;

    // Kiểm tra classification có tồn tại không
    const existingClassification = await Classification.findOne({
      where: { classificationId: classificationId },
    });

    if (!existingClassification) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy classification",
      });
    }

    // Kiểm tra xem tên mới đã tồn tại chưa (trừ classification hiện tại)
    const existingName = await Classification.findOne({
      where: {
        name: name,
        classificationId: { [require("sequelize").Op.ne]: classificationId },
      },
    });

    if (existingName) {
      return res.status(400).json({
        success: false,
        message: "Tên classification đã tồn tại",
      });
    }

    // Cập nhật tên
    await existingClassification.update({
      name: name,
    });

    return res.status(200).json({
      success: true,
      message: "Cập nhật classification thành công",
      data: {
        classificationId: existingClassification.classificationId,
        name: existingClassification.name,
        status: existingClassification.status,
      },
    });
  } catch (error) {
    console.error("Error in updateClassification:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi cập nhật classification",
      error: error.message,
    });
  }
};

// Xóa classification
const deleteClassification = async (req, res) => {
  try {
    const classificationId =
      req.classificationIdFromQuery || req.params.classificationId;

    // Kiểm tra classification có tồn tại không
    const existingClassification = await Classification.findOne({
      where: { classificationId: classificationId },
    });

    if (!existingClassification) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy classification",
      });
    }

    // Kiểm tra xem classification có liên kết với product nào không
    const linkedProducts = await ClassificationProduct.findOne({
      where: { classificationId: classificationId },
    });

    if (linkedProducts) {
      // Nếu có liên kết với product, chuyển status thành OFF
      await existingClassification.update({
        status: "OFF",
      });

      return res.status(200).json({
        success: true,
        message:
          "Classification đã được chuyển sang trạng thái OFF vì có liên kết với sản phẩm",
        data: {
          classificationId: existingClassification.classificationId,
          name: existingClassification.name,
          status: "OFF",
        },
      });
    } else {
      // Nếu không có liên kết, xóa hoàn toàn
      await existingClassification.destroy();

      return res.status(200).json({
        success: true,
        message: "Classification đã được xóa hoàn toàn",
        data: {
          classificationId: existingClassification.classificationId,
          name: existingClassification.name,
        },
      });
    }
  } catch (error) {
    console.error("Error in deleteClassification:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi xóa classification",
      error: error.message,
    });
  }
};

module.exports = {
  getAllClassifications,
  getClassificationById,
  createClassification,
  updateClassification,
  deleteClassification,
};
