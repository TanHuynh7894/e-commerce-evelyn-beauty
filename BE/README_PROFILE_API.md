# Profile API Documentation

## Tổng quan

API quản lý profile cho customer (role = 'CU') trong hệ thống Evelyn Beauty.

## Base URL

```
http://localhost:3000/api/profiles
```

## Authentication

Tất cả các endpoint đều yêu cầu JWT token trong header:

```
Authorization: Bearer <your_jwt_token>
```

## Endpoints

### 1. Lấy thông tin profile của customer hiện tại

**GET** `/my-profile`

**Quyền:** Chỉ customer (role = 'CU')

**Response khi có profile:**

```json
{
  "message": "Lấy thông tin profile thành công",
  "hasProfile": true,
  "profile": {
    "profileId": "PF1234567890abc",
    "name": "Nguyễn Văn A",
    "phone": "0123456789",
    "address": "123 Đường ABC, Quận 1, TP.HCM",
    "gender": "M",
    "birthday": "1990-01-01T00:00:00.000Z",
    "image": "https://example.com/avatar.jpg"
  }
}
```

**Response khi chưa có profile:**

```json
{
  "message": "Chưa có profile. Vui lòng tạo profile mới.",
  "hasProfile": false,
  "accountId": "AC1234567890"
}
```

### 2. Tạo profile mới

**POST** `/`

**Quyền:** Chỉ customer (role = 'CU')

**Request Body:**

```json
{
  "name": "Nguyễn Văn A",
  "phone": "0123456789",
  "address": "123 Đường ABC, Quận 1, TP.HCM",
  "gender": "M",
  "birthday": "1990-01-01",
  "image": "https://example.com/avatar.jpg" // optional
}
```

**Validation:**

- `name`: Bắt buộc, tối đa 40 ký tự
- `phone`: Bắt buộc, đúng 10 chữ số
- `address`: Bắt buộc, tối đa 255 ký tự
- `gender`: Bắt buộc, chỉ nhận giá trị 'F' (Female) hoặc 'M' (Male)
- `birthday`: Bắt buộc, định dạng date
- `image`: Tùy chọn, URL hình ảnh

**Response:**

```json
{
  "message": "Tạo profile thành công",
  "profile": {
    "profileId": "PF1234567890abc",
    "name": "Nguyễn Văn A",
    "phone": "0123456789",
    "address": "123 Đường ABC, Quận 1, TP.HCM",
    "gender": "M",
    "birthday": "1990-01-01T00:00:00.000Z",
    "image": "https://example.com/avatar.jpg"
  }
}
```

### 3. Cập nhật profile

**PUT** `/profileId`

**Quyền:** Chỉ customer (role = 'CU')

**Request Body:** (Giống như tạo mới)

```json
{
  "name": "Nguyễn Văn A",
  "phone": "0123456789",
  "address": "123 Đường ABC, Quận 1, TP.HCM",
  "gender": "M",
  "birthday": "1990-01-01",
  "image": "https://example.com/avatar.jpg"
}
```

**Response:**

```json
{
  "message": "Cập nhật profile thành công",
  "profile": {
    "profileId": "PF1234567890abc",
    "name": "Nguyễn Văn A",
    "phone": "0123456789",
    "address": "123 Đường ABC, Quận 1, TP.HCM",
    "gender": "M",
    "birthday": "1990-01-01T00:00:00.000Z",
    "image": "https://example.com/avatar.jpg"
  }
}
```

### 4. Xóa profile

**DELETE** `/`

**Quyền:** Chỉ customer (role = 'CU')

**Response:**

```json
{
  "message": "Xóa profile thành công"
}
```

## Error Responses

### 401 Unauthorized

```json
{
  "message": "Không có token xác thực"
}
```

### 403 Forbidden

```json
{
  "message": "Chỉ customer mới có quyền xem profile của mình"
}
```

### 400 Bad Request

```json
{
  "message": "Vui lòng điền đầy đủ thông tin: name, phone, address, gender, birthday"
}
```

### 404 Not Found

```json
{
  "message": "Không tìm thấy profile. Vui lòng tạo profile trước."
}
```

### 409 Conflict

```json
{
  "message": "Đã có profile cho tài khoản này"
}
```

### 500 Internal Server Error

```json
{
  "message": "Lỗi server khi lấy thông tin profile"
}
```

## Ví dụ sử dụng với JavaScript

```javascript
// Lấy thông tin profile
const getProfile = async () => {
  try {
    const response = await fetch(
      "http://localhost:3000/api/profiles/my-profile",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    if (data.hasProfile) {
      console.log("Profile:", data.profile);
    } else {
      console.log("Chưa có profile, cần tạo mới");
    }
  } catch (error) {
    console.error("Lỗi:", error);
  }
};

// Tạo profile mới
const createProfile = async (profileData) => {
  try {
    const response = await fetch("http://localhost:3000/api/profiles", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(profileData),
    });

    const data = await response.json();
    console.log("Tạo profile thành công:", data.profile);
  } catch (error) {
    console.error("Lỗi:", error);
  }
};
```

## Lưu ý

- Chỉ customer (role = 'CU') mới có quyền truy cập các API này
- Mỗi account chỉ có thể có một profile
- Tất cả các thông tin cá nhân đều được validate kỹ lưỡng
- Profile ID được tạo tự động với format: `PF` + timestamp + random string
