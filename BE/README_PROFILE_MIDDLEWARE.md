# Profile Middleware Documentation

## Tổng quan

File `profiles.middlewares.js` chứa các middleware xử lý validation, bảo mật và logic nghiệp vụ cho Profile API.

## Danh sách Middleware

### 1. `validateProfileData`

**Mục đích:** Validate toàn bộ dữ liệu profile trước khi xử lý

**Validation rules:**

- ✅ **Name**: Chuỗi, 1-40 ký tự
- ✅ **Phone**: Đúng 10 chữ số
- ✅ **Address**: Chuỗi, 1-255 ký tự
- ✅ **Gender**: Chỉ 'F' hoặc 'M'
- ✅ **Birthday**: Date hợp lệ, không trong tương lai, ít nhất 13 tuổi
- ✅ **Image**: URL hợp lệ (HTTP/HTTPS) nếu có

**Error responses:**

```json
{
  "message": "Tên phải là chuỗi và có độ dài từ 1-40 ký tự"
}
```

### 2. `checkProfileExists`

**Mục đích:** Kiểm tra profile đã tồn tại (cho create)

**Logic:**

- Tìm profile theo accountId
- Nếu đã có → trả lỗi 409 Conflict
- Nếu chưa có → tiếp tục

**Error response:**

```json
{
  "message": "Đã có profile cho tài khoản này",
  "profileId": "PF1234567890abc"
}
```

### 3. `checkProfileNotExists`

**Mục đích:** Kiểm tra profile chưa tồn tại (cho update/delete)

**Logic:**

- Tìm profile theo accountId
- Nếu chưa có → trả lỗi 404 Not Found
- Nếu có → set `req.profile` và tiếp tục

**Error response:**

```json
{
  "message": "Không tìm thấy profile. Vui lòng tạo profile trước."
}
```

### 4. `checkProfileAccess`

**Mục đích:** Kiểm tra quyền truy cập profile

**Logic:**

- Nếu có profileId trong params
- Kiểm tra profile có tồn tại không
- Kiểm tra profile có thuộc về user hiện tại không
- Set `req.profile` nếu hợp lệ

**Error responses:**

```json
{
  "message": "Không tìm thấy profile"
}
```

```json
{
  "message": "Bạn chỉ có thể truy cập profile của chính mình"
}
```

### 5. `sanitizeProfileData`

**Mục đích:** Làm sạch dữ liệu đầu vào

**Xử lý:**

- Loại bỏ HTML tags (`<`, `>`)
- Escape ký tự đặc biệt (`&`, `"`, `'`, `/`)
- Loại bỏ ký tự không phải số trong phone

**Ví dụ:**

```javascript
// Input: "<script>alert('xss')</script>"
// Output: "&lt;script&gt;alert(&#x27;xss&#x27;)&lt;/script&gt;"
```

### 6. `validatePhoneFormat`

**Mục đích:** Validate định dạng số điện thoại Việt Nam

**Regex pattern:**

```javascript
/^(0|\+84)(3[2-9]|5[689]|7[06-9]|8[1-689]|9[0-46-9])[0-9]{7}$/;
```

**Các đầu số hợp lệ:**

- 032-039: Viettel
- 056, 058, 059: Vietnamobile
- 070, 076, 077, 078, 079: Gmobile
- 081-089: Vinaphone
- 090, 091, 094, 096, 097: Viettel
- 092, 093, 095, 098: Vinaphone

**Error response:**

```json
{
  "message": "Số điện thoại không đúng định dạng số Việt Nam"
}
```

### 7. `profileRateLimit`

**Mục đích:** Giới hạn số lượng request

**Giới hạn:**

- 10 requests/phút cho mỗi IP
- Reset sau 1 phút

**Error response:**

```json
{
  "message": "Quá nhiều yêu cầu. Vui lòng thử lại sau 1 phút."
}
```

## Cách sử dụng trong Routes

```javascript
// Tạo profile mới
router.post(
  "/",
  verifyToken,
  requireRole("CU"),
  profileRateLimit, // Giới hạn request
  sanitizeProfileData, // Làm sạch dữ liệu
  validateProfileData, // Validate dữ liệu
  validatePhoneFormat, // Validate phone
  checkProfileExists, // Kiểm tra chưa có profile
  createProfile // Controller
);

// Cập nhật profile
router.put(
  "/",
  verifyToken,
  requireRole("CU"),
  profileRateLimit,
  sanitizeProfileData,
  validateProfileData,
  validatePhoneFormat,
  checkProfileNotExists, // Kiểm tra đã có profile
  updateProfile
);
```

## Lợi ích của Middleware

### 🔒 Bảo mật

- **XSS Protection**: Sanitize HTML tags
- **Input Validation**: Kiểm tra dữ liệu đầu vào
- **Access Control**: Kiểm tra quyền truy cập
- **Rate Limiting**: Chống spam/attack

### 🎯 Tách biệt logic

- **Separation of Concerns**: Mỗi middleware một nhiệm vụ
- **Reusability**: Có thể tái sử dụng
- **Maintainability**: Dễ bảo trì và mở rộng

### 📊 Validation chi tiết

- **Business Rules**: Tuổi tối thiểu, định dạng phone
- **Data Integrity**: Kiểm tra tính toàn vẹn dữ liệu
- **User Experience**: Thông báo lỗi rõ ràng

## Customization

### Thêm validation mới

```javascript
const customValidation = (req, res, next) => {
  // Logic validation
  if (condition) {
    return res.status(400).json({ message: "Error" });
  }
  next();
};
```

### Thay đổi rate limit

```javascript
// Trong profileRateLimit middleware
if (rateLimit.count > 20) {
  // Thay đổi từ 10 thành 20
  return res.status(429).json({ message: "Rate limit exceeded" });
}
```

### Thêm sanitization rules

```javascript
// Trong sanitizeProfileData middleware
const sanitizeString = (str) => {
  return str
    .replace(/[<>]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;")
    .replace(/javascript:/gi, ""); // Thêm rule mới
};
```

## Testing Middleware

### Test validation

```javascript
// Test với dữ liệu không hợp lệ
const invalidData = {
  name: "", // Empty name
  phone: "123", // Invalid phone
  gender: "X", // Invalid gender
};
```

### Test rate limiting

```javascript
// Gửi nhiều request liên tiếp
for (let i = 0; i < 15; i++) {
  // Gọi API
  // Request thứ 11-15 sẽ bị block
}
```

### Test sanitization

```javascript
// Test với dữ liệu có HTML tags
const maliciousData = {
  name: '<script>alert("xss")</script>',
  address: '&lt;img src="x" onerror="alert(1)"&gt;',
};
```
