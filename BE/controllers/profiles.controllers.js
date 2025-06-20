const { Profile, Account, Order } = require("../models");

//Lấy thông tin profile của customer hiện tại
const getMyProfile = async (req, res) => {
  try {
    const { accountId } = req.user;

    // Tìm profile của customer
    const profile = await Profile.findOne({
      where: { accountId },
      attributes: [
        "profileId",
        "name",
        "phone",
        "address",
        "gender",
        "birthday",
        "image",
      ],
    });

    if (!profile) {
      // Nếu chưa có profile, trả về thông tin để tạo mới
      return res.status(404).json({
        message: "Chưa có profile. Vui lòng tạo profile mới.",
        hasProfile: false,
        accountId: accountId,
      });
    }

    // Nếu có profile, trả về thông tin profile
    return res.status(200).json({
      message: "Lấy thông tin profile thành công",
      hasProfile: true,
      profile: {
        profileId: profile.profileId,
        name: profile.name,
        phone: profile.phone,
        address: profile.address,
        gender: profile.gender,
        birthday: profile.birthday,
        image: profile.image,
      },
    });
  } catch (error) {
    console.error("Lỗi khi lấy profile:", error);
    return res.status(500).json({
      message: "Lỗi server khi lấy thông tin profile",
    });
  }
};

// Tạo profile mới cho customer
const createProfile = async (req, res) => {
  try {
    const { accountId } = req.user;
    const { name, phone, address, gender, birthday, image } = req.body;

    // Tạo profileId mới
    const profileId =
      "PF" + Date.now();

    // Tạo profile mới
    const newProfile = await Profile.create({
      profileId,
      accountId,
      name,
      phone,
      address,
      gender,
      birthday,
      image,
    });

    return res.status(201).json({
      message: "Tạo profile thành công",
      profile: {
        profileId: newProfile.profileId,
        name: newProfile.name,
        phone: newProfile.phone,
        address: newProfile.address,
        gender: newProfile.gender,
        birthday: newProfile.birthday,
        image: newProfile.image,
      },
    });
  } catch (error) {
    console.error("Lỗi khi tạo profile:", error);
    return res.status(500).json({
      message: "Lỗi server khi tạo profile",
    });
  }
};

// Cập nhật profile theo profileId truyền qua query string
const updateProfileById = async (req, res) => {
  try {
    const { profileId } = req.query;
    const { accountId } = req.user;
    const { name, phone, address, gender, birthday, image } = req.body;

    if (!profileId) {
      return res
        .status(400)
        .json({ message: "Thiếu profileId trên query string" });
    }

    // Chỉ cho phép update profile thuộc về accountId hiện tại
    const profile = await Profile.findOne({ where: { profileId, accountId } });
    if (!profile) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy profile hoặc không có quyền" });
    }

    await profile.update({
      name,
      phone,
      address,
      gender,
      birthday,
      image: image || profile.image,
    });

    return res.status(200).json({
      message: "Cập nhật profile thành công",
      profile: {
        profileId: profile.profileId,
        name: profile.name,
        phone: profile.phone,
        address: profile.address,
        gender: profile.gender,
        birthday: profile.birthday,
        image: profile.image,
      },
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật profile:", error);
    return res.status(500).json({ message: "Lỗi server khi cập nhật profile" });
  }
};

// Xóa profile theo profileId truyền qua query string
const deleteProfileById = async (req, res) => {
  try {
    const { profileId } = req.query;
    const { accountId } = req.user;

    if (!profileId) {
      return res
        .status(400)
        .json({ message: "Thiếu profileId trên query string" });
    }

    // Chỉ cho phép xóa profile thuộc về accountId hiện tại
    const profile = await Profile.findOne({ where: { profileId, accountId } });
    if (!profile) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy profile hoặc không có quyền" });
    }

    // Kiểm tra xem profile này có Order nào không
    const order = await Order.findOne({ where: { profileId } });
    if (order) {
      // Nếu có Order, update status thành OFF
      await profile.update({ status: "OFF" });
      return res
        .status(200)
        .json({ message: "Profile đã có đơn hàng, chuyển trạng thái OFF" });
    } else {
      // Nếu không có Order, xóa profile
      await profile.destroy();
      return res.status(200).json({ message: "Xóa profile thành công" });
    }
  } catch (error) {
    console.error("Lỗi khi xóa profile:", error);
    return res.status(500).json({ message: "Lỗi server khi xóa profile" });
  }
};

//Lấy tất cả profile của account hiện tại
const getAllProfilesOfAccount = async (req, res) => {
  try {
    const { accountId } = req.user;
    const profiles = await Profile.findAll({
      where: { accountId, status: "ON" },
      attributes: [
        "profileId",
        "name",
        "phone",
        "address",
        "gender",
        "birthday",
        "image",
      ],
    });
    return res.status(200).json({ profiles });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách profile:", error);
    return res
      .status(500)
      .json({ message: "Lỗi server khi lấy danh sách profile" });
  }
};

module.exports = {
  getMyProfile,
  createProfile,
  getAllProfilesOfAccount,
  updateProfileById,
  deleteProfileById,
};
