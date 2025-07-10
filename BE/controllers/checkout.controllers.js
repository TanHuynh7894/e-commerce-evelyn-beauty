const { Profile, Product, ClassificationProduct, PromotionProgram, Order } = require('../models');
const { Op } = require('sequelize');
const axios = require('axios');

// Hàm lấy phí ship từ address profile (GHN API)
async function getShipCostByProfile(profile) {
  // GHN config
  const ghn = axios.create({
    baseURL: 'https://online-gateway.ghn.vn/shiip/public-api',
    headers: {
      Token: process.env.GHN_TOKEN,
      ShopId: process.env.GHN_SHOP_ID,
      'Content-Type': 'application/json',
    },
  });
  // Parse address
  function parseAddressByComma(address) {
    const parts = address.split(',').map((p) => p.trim()).filter(Boolean);
    const n = parts.length;
    return {
      detail: parts[0] || '',
      ward: parts[n - 3] || '',
      district: parts[n - 2] || '',
      province: parts[n - 1] || '',
    };
  }
  function removeVietnameseTones(str) {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .replace(/\s+/g, ' ')
      .trim();
  }
  const PROVINCE_ALIASES = {
    'thanh pho hcm': 'ho chi minh',
    'tp hcm': 'ho chi minh',
    tphcm: 'ho chi minh',
    hcm: 'ho chi minh',
    'tp ho chi minh': 'ho chi minh',
    'thanh pho ho chi minh': 'ho chi minh',
    hn: 'ha noi',
    'tp ha noi': 'ha noi',
  };
  function normalizeText(str) {
    if (!str) return '';
    str = removeVietnameseTones(str)
      .toLowerCase()
      .replace(/^(tp|tinh|thanh pho|quan|huyen|thi xa|phuong|xa)\.?\s*/gi, '')
      .replace(/\./g, '')
      .replace(/[\s,-]+/g, ' ')
      .trim();
    return PROVINCE_ALIASES[str] || str;
  }
  const parsed = parseAddressByComma(profile.address);
  // 1. Tìm province
  const provincesRes = await ghn.get('/master-data/province');
  const provinces = provincesRes.data.data;
  const parsedProvinceNorm = normalizeText(parsed.province);
  let province = provinces.find((p) => {
    const pNorm = normalizeText(p.ProvinceName);
    return (
      pNorm === parsedProvinceNorm ||
      pNorm.includes(parsedProvinceNorm) ||
      parsedProvinceNorm.includes(pNorm)
    );
  });
  if (!province) {
    const alias = PROVINCE_ALIASES[parsedProvinceNorm];
    if (alias) {
      province = provinces.find((p) => normalizeText(p.ProvinceName) === alias);
    }
  }
  if (!province) throw new Error('Không tìm thấy tỉnh/thành phù hợp với địa chỉ!');
  // 2. Tìm district
  const districtsRes = await ghn.post('/master-data/district', { province_id: province.ProvinceID });
  const districts = districtsRes.data.data;
  const parsedDistrictNorm = normalizeText(parsed.district).replace('thanh pho ', '');
  const district = districts.find((d) => {
    const dNorm = normalizeText(d.DistrictName);
    return (
      dNorm === parsedDistrictNorm ||
      dNorm.includes(parsedDistrictNorm) ||
      parsedDistrictNorm.includes(dNorm) ||
      dNorm.startsWith(parsedDistrictNorm.slice(0, 5))
    );
  });
  if (!district) throw new Error('Không tìm thấy quận/huyện phù hợp với địa chỉ!');
  // 3. Tìm ward
  const wardsRes = await ghn.post('/master-data/ward', { district_id: district.DistrictID });
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
  if (!ward) throw new Error('Không tìm thấy phường/xã phù hợp với địa chỉ!');
  // 4. Lấy dịch vụ giao hàng
  const availableServicesRes = await ghn.post('/v2/shipping-order/available-services', {
    shop_id: parseInt(process.env.GHN_SHOP_ID),
    from_district: 1454,
    to_district: district.DistrictID,
  });
  const services = availableServicesRes.data.data;
  if (!services || services.length === 0) throw new Error('Không có dịch vụ giao hàng phù hợp');
  const service_id = services[0].service_id;
  // 5. Gọi tính phí tiền
  const feeRes = await ghn.post('/v2/shipping-order/fee', {
    service_id,
    insurance_value: 1000000,
    from_district_id: 1454,
    to_district_id: district.DistrictID,
    to_ward_code: ward.WardCode,
    weight: 500,
    length: 10,
    width: 10,
    height: 10,
  });
  return feeRes.data.data.total;
}

// Hàm lấy ship_fee từ profileId và address (bắt buộc truyền cả 2, không trả về address)
async function getShipFee(profileId, address) {
  if (!profileId || !address) throw new Error('Thiếu profileId hoặc address');
  // Ưu tiên lấy shipFee từ order gần nhất
  let shipFee = null;
  const lastOrder = await Order.findOne({ where: { profileId }, order: [['date', 'DESC']] });
  if (lastOrder && lastOrder.shipFee != null) {
    shipFee = Number(lastOrder.shipFee);
  } else {
    // fallback: tính phí ship từ address (GHN API)
    try {
      shipFee = await getShipCostByProfile({ address });
    } catch (err) {
      shipFee = 0;
    }
  }
  return shipFee;
}



// API tổng hợp cho checkout
const checkout = async (req, res) => {
  try {
    const { profileId, address, items, programId } = req.body;
    // Nếu thiếu address thì báo lỗi
    if (!address) {
      return res.status(400).json({ message: 'Thiếu address' });
    }
    // Nếu chỉ truyền profileId và address, trả về shipCost
    if (profileId && address && (!items || items.length === 0)) {
      const shipFee = await getShipFee(profileId, address);
      return res.status(200).json({ shipCost: shipFee });
    }
    // Nếu truyền đủ thông tin, trả về full checkout
    if (!profileId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Thiếu profileId hoặc danh sách sản phẩm' });
    }
    // Lấy cartId của user hiện tại
    const cart = await require('../models').Cart.findOne({ where: { accountId: req.user.accountId } });
    if (!cart) return res.status(404).json({ message: 'Không tìm thấy giỏ hàng của bạn' });
    // Lấy thông tin profile
    const profile = await Profile.findOne({ where: { profileId } });
    if (!profile) return res.status(404).json({ message: 'Không tìm thấy profile' });
    // Kiểm tra quyền truy cập profile
    if (profile.accountId !== req.user.accountId) {
      return res.status(403).json({ message: 'Bạn không có quyền truy cập profile này!' });
    }
    // Lấy danh sách cart-item thực tế
    const cartItemsDb = await require('../models').CartItem.findAll({
      where: { cartId: cart.cartId, status: 'ON' },
      attributes: ['productId', 'classificationId', 'quantity'] // Thêm quantity vào đây
    });
    // Lọc lại items chỉ giữ sản phẩm có trong cart-item
    const cartItemSet = new Set(cartItemsDb.map(i => String(i.productId).trim() + '-' + String(i.classificationId).trim()));
    const validItems = items.filter(i => cartItemSet.has(String(i.productId).trim() + '-' + String(i.classificationId).trim()));
    // Tạo map để lấy quantity thực tế từ cart-item DB
    const cartItemMap = {};
    cartItemsDb.forEach(i => {
      const key = String(i.productId).trim() + '-' + String(i.classificationId).trim();
      cartItemMap[key] = i.quantity;
    });
    // Lấy thông tin sản phẩm từ DB
    const products = await Product.findAll({
      where: { productId: { [Op.in]: validItems.map(i => i.productId) } },
      attributes: ['productId', 'name', 'price', 'image_1']
    });
    const productMap = {};
    products.forEach(p => { productMap[p.productId] = p; });
    // Lấy thông tin classification cho từng sản phẩm
    const classificationList = await ClassificationProduct.findAll({
      where: { [Op.or]: validItems.map(i => ({ productId: i.productId, classificationId: i.classificationId })) },
      attributes: ['productId', 'classificationId'],
      include: [{ model: require('../models').Classification, as: 'classification', attributes: ['name'] }]
    });
    const classificationMap = {};
    classificationList.forEach(c => {
      const key = c.productId + '-' + c.classificationId;
      classificationMap[key] = c.classification ? c.classification.name : null;
    });
    const classificationSet = new Set(classificationList.map(c => c.productId + '-' + c.classificationId));
    // Chuẩn hóa output sản phẩm
    let sumTotal = 0;
    const productsResult = validItems.map(i => {
      const p = productMap[i.productId];
      const key = String(i.productId).trim() + '-' + String(i.classificationId).trim();
      const quantity = Number(cartItemMap[key]) || 0;
      if (!p || !classificationSet.has(i.productId + '-' + i.classificationId)) return null;
      const price = Number(p.price);
      const total = price * quantity;
      sumTotal += total;
      return {
        productId: i.productId,
        classificationId: i.classificationId,
        name: p.name,
        image1: p.image_1,
        price,
        quantity, 
        total,
        classificationName: classificationMap[key] || null
      };
    }).filter(Boolean);
    // 3. Lấy giá trị khuyến mãi
    let promotionValue = 0;
    if (programId) {
      const promo = await PromotionProgram.findByPk(programId);
      if (promo && promo.value) promotionValue = Number(promo.value);
    }
    // 4. Lấy shipFee từ hàm mới, dùng address truyền vào
    const shipFee = await getShipFee(profileId, address);
    // 5. Tính totalGoods mới
    let totalGoods = sumTotal * (1 - promotionValue) + Number(shipFee);
    if (totalGoods < 0) totalGoods = 0;
    // Thêm totalGoods vào cuối mảng products
    productsResult.push({ totalGoods });
    // 6. Trả về kết quả
    return res.status(200).json({
      profile,
      products: productsResult,
      promotionValue,
      shipCost: shipFee
    });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi server khi checkout', error: error.message });
  }
};

module.exports = {
  checkout,
};
