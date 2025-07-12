const { Profile, Account, Order } = require("../models");

//Lấy thông tin profile của customer hiện tại
const getMyProfile = async (req, res) => {
  try {
    const { accountId, role } = req.user;

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
      // Nếu chưa có profile, trả về thông báo phù hợp cho role ST
      if (role === "SF") {
        return res.status(404).json({
          message: "Chưa có profile, hãy liên hệ với chủ shop để tạo profile",
          hasProfile: false,
          accountId: accountId,
        });
      } else {
        // Nếu không phải ST, giữ nguyên thông báo cũ
        return res.status(404).json({
          message: "Chưa có profile. Vui lòng tạo profile mới.",
          hasProfile: false,
          accountId: accountId,
        });
      }
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

    // Kiểm tra các trường bắt buộc
    if (!name || name.trim() === "") {
      return res.status(400).json({
        message: "Tên không được để trống",
      });
    }

    if (!phone || phone.trim() === "") {
      return res.status(400).json({
        message: "Số điện thoại không được để trống",
      });
    }

    if (!address || address.trim() === "") {
      return res.status(400).json({
        message: "Địa chỉ không được để trống",
      });
    }

    // Kiểm tra địa chỉ phải có đầy đủ thông tin
    // Tách địa chỉ, bỏ qua các phần rỗng do nhập thừa dấu phẩy hoặc khoảng trắng
    const addressParts = address
      .split(",")
      .map((part) => part.trim())
      .filter((part) => part.length > 0);

    // Danh sách các trường bắt buộc (phù hợp thực tế VN hiện tại)
    const addressFields = [
      { key: "street", label: "Tên đường" },
      { key: "ward", label: "Phường/Xã" },
      { key: "district", label: "Quận/Huyện/Thành phố thuộc tỉnh" },
      { key: "province", label: "Tỉnh/Thành" },
    ];

    if (addressParts.length < addressFields.length) {
      return res.status(400).json({
        message:
          "Địa chỉ phải có đầy đủ: Tên đường, Phường/Xã, Quận/Huyện/Thành phố thuộc tỉnh, Tỉnh/Thành",
        example:
          "135 Đường Lê Văn Việt, Phường Long Thạnh Mỹ, Thành phố Thủ Đức, TP. Hồ Chí Minh",
      });
    }

    // Kiểm tra từng phần của địa chỉ
    for (let i = 0; i < addressFields.length; i++) {
      if (!addressParts[i] || addressParts[i] === "") {
        return res.status(400).json({
          message: `${addressFields[i].label} không được để trống`,
        });
      }
    }

    // (Đã xóa kiểm tra chỉ cho phép 1 profile/account, giờ 1 account có thể tạo nhiều profile)

    // Tạo profileId mới
    const profileId = "PF" + Date.now();

    // Tạo profile mới
    const newProfile = await Profile.create({
      profileId,
      accountId,
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
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

//Xóa profile theo profileId truyền qua query string
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

// Lấy tất cả profile của account hiện tại
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

// Lấy tất cả profile của các account có role là SF (chỉ cho OS)
const getAllProfilesOfStaff = async (req, res) => {
  try {
    const { role } = req.user;
    if (role !== "OS") {
      return res.status(403).json({ message: "Không có quyền truy cập" });
    }
    // Lấy tất cả accountId có role là SF
    const staffAccounts = await Account.findAll({
      where: { role: "SF" },
      attributes: ["accountId"],
    });
    const staffAccountIds = staffAccounts.map((acc) => acc.accountId);
    // Lấy tất cả profile thuộc các accountId này
    const profiles = await Profile.findAll({
      where: { accountId: staffAccountIds, status: "ON" },
      attributes: [
        "profileId",
        "name",
        "phone",
        "address",
        "gender",
        "birthday",
        "image",
        "accountId",
      ],
    });
    return res.status(200).json({ profiles });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách profile của staff:", error);
    return res
      .status(500)
      .json({ message: "Lỗi server khi lấy danh sách profile của staff" });
  }
};

// OS tạo profile mới cho accountId có role là SF
const createProfileForStaff = async (req, res) => {
  try {
    const { role } = req.user;
    const { accountId, name, phone, address, gender, birthday, image } =
      req.body;
    if (role !== "OS") {
      return res.status(403).json({ message: "Không có quyền truy cập" });
    }
    // Kiểm tra accountId có tồn tại và là role SF không
    const staffAccount = await Account.findOne({
      where: { accountId, role: "SF" },
    });
    if (!staffAccount) {
      return res.status(404).json({
        message: "Không tìm thấy account staff hoặc không phải role SF",
      });
    }
    // Tạo profileId mới
    const profileId = "PF" + Date.now();
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
      message: "Tạo profile cho staff thành công",
      profile: {
        profileId: newProfile.profileId,
        name: newProfile.name,
        phone: newProfile.phone,
        address: newProfile.address,
        gender: newProfile.gender,
        birthday: newProfile.birthday,
        image: newProfile.image,
        accountId: newProfile.accountId,
      },
    });
  } catch (error) {
    console.error("Lỗi khi tạo profile cho staff:", error);
    return res
      .status(500)
      .json({ message: "Lỗi server khi tạo profile cho staff" });
  }
};

// OS cập nhật profile của accountId có role là SF
const updateProfileOfStaff = async (req, res) => {
  try {
    const { role } = req.user;
    const {
      accountId,
      profileId,
      name,
      phone,
      address,
      gender,
      birthday,
      image,
    } = req.body;
    if (role !== "OS") {
      return res.status(403).json({ message: "Không có quyền truy cập" });
    }
    // Kiểm tra accountId có tồn tại và là role SF không
    const staffAccount = await Account.findOne({
      where: { accountId, role: "SF" },
    });
    if (!staffAccount) {
      return res.status(404).json({
        message: "Không tìm thấy account staff hoặc không phải role SF",
      });
    }
    // Kiểm tra profile có tồn tại không
    const profile = await Profile.findOne({ where: { profileId, accountId } });
    if (!profile) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy profile cho account staff này" });
    }
    // Chỉ cập nhật các trường được truyền lên
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (gender !== undefined) updateData.gender = gender;
    if (birthday !== undefined) updateData.birthday = birthday;
    if (image !== undefined) updateData.image = image;
    await profile.update(updateData);
    return res.status(200).json({
      message: "Cập nhật profile cho staff thành công",
      profile: {
        profileId: profile.profileId,
        name: profile.name,
        phone: profile.phone,
        address: profile.address,
        gender: profile.gender,
        birthday: profile.birthday,
        image: profile.image,
        accountId: profile.accountId,
      },
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật profile cho staff:", error);
    return res
      .status(500)
      .json({ message: "Lỗi server khi cập nhật profile cho staff" });
  }
};

// OS xóa profile của accountId có role là SF
const deleteProfileOfStaffById = async (req, res) => {
  try {
    const { role } = req.user;
    const { accountId, profileId } = req.body;
    if (role !== "OS") {
      return res.status(403).json({ message: "Không có quyền truy cập" });
    }
    // Kiểm tra accountId có tồn tại và là role SF không
    const staffAccount = await Account.findOne({
      where: { accountId, role: "SF" },
    });
    if (!staffAccount) {
      return res.status(404).json({
        message: "Không tìm thấy account staff hoặc không phải role SF",
      });
    }
    // Kiểm tra profile có tồn tại không
    const profile = await Profile.findOne({ where: { profileId, accountId } });
    if (!profile) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy profile cho account staff này" });
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
    console.error("Lỗi khi xóa profile staff:", error);
    return res
      .status(500)
      .json({ message: "Lỗi server khi xóa profile staff" });
  }
};

module.exports = {
  getMyProfile,
  createProfile,
  getAllProfilesOfAccount,
  updateProfileById,
  deleteProfileById,
  getAllProfilesOfStaff,
  createProfileForStaff,
  updateProfileOfStaff,
  deleteProfileOfStaffById,
};
