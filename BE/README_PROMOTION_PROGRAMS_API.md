# Promotion Programs API

## Tổng quan

API này cho phép quản lý các chương trình khuyến mãi trong hệ thống.

## Base URL

```
http://localhost:3000/api/promotion-programs
```

## Authentication

Tất cả các endpoint đều yêu cầu JWT Token trong header: `Authorization: Bearer <token>`

## Endpoints

### 1. Lấy promotion programs đang hoạt động (Role CU - Customer)

**GET** `/api/promotion-programs`

**Authentication:** Role `CU` (Customer)

**Query Parameters:**

- `page` (optional): Số trang (mặc định: 1)
- `limit` (optional): Số lượng items per page (mặc định: 10)

**Response:**

```json
{
  "message": "Lấy danh sách promotion programs đang hoạt động thành công",
  "data": {
    "promotionPrograms": [
      {
        "programId": "PROMO1703123456789",
        "name": "Giảm giá 20% cho mỹ phẩm",
        "condition1": "MIN_ORDER_500K",
        "condition2": "NEW_CUSTOMER",
        "value": 0.2,
        "startDate": "2024-01-01T00:00:00.000Z",
        "endDate": "2024-12-31T23:59:59.000Z",
        "accountId": "ACC001",
        "status": "ON"
      }
    ],
    "pagination": {
      "total": 1,
      "page": 1,
      "limit": 10,
      "totalPages": 1
    }
  }
}
```

### 2. Tạo mới promotion program (Role OS - Owner/Staff)

**POST** `/api/promotion-programs`

**Authentication:** Role `OS` (Owner/Staff)

**Request Body:**

```json
{
  "name": "Giảm giá 20% cho mỹ phẩm",
  "condition1": "MIN_ORDER_500K",
  "condition2": "NEW_CUSTOMER",
  "value": 0.2,
  "startDate": "2024-01-01T00:00:00.000Z",
  "endDate": "2024-12-31T23:59:59.000Z"
}
```

**Field Validation:**

- `name` (required): Tên promotion program (max 5000 ký tự)
- `condition1` (required): Điều kiện 1 (max 20 ký tự)
- `condition2` (optional): Điều kiện 2 (max 20 ký tự, có thể null)
- `value` (required): Giá trị giảm giá (số dương)
  - Nếu `value < 1`: Giảm theo phần trăm (ví dụ: 0.2 = 20%)
  - Nếu `value >= 1`: Giảm theo số tiền cố định (ví dụ: 50000 = 50,000 VNĐ)
- `startDate` (required): Ngày bắt đầu (phải nhỏ hơn endDate)
- `endDate` (required): Ngày kết thúc

**Response:**

```json
{
  "message": "Tạo promotion program thành công",
  "data": {
    "promotionProgram": {
      "programId": "PROMO1703123456789",
      "status": "ON",
      "name": "Giảm giá 20% cho mỹ phẩm",
      "condition1": "MIN_ORDER_500K",
      "condition2": "NEW_CUSTOMER",
      "value": 0.2,
      "startDate": "2024-01-01T00:00:00.000Z",
      "endDate": "2024-12-31T23:59:59.000Z",
      "accountId": "ACC001"
    },
    "discountInfo": {
      "type": "Phần trăm",
      "value": "20%"
    }
  }
}
```

### 3. Lấy tất cả promotion programs có status 'ON' (Role OS)

**GET** `/api/promotion-programs/os/on`

**Authentication:** Role `OS`

**Query Parameters:**

- `page` (optional): Số trang (mặc định: 1)
- `limit` (optional): Số lượng items per page (mặc định: 10)

**Response:**

```json
{
  "message": "Lấy danh sách promotion programs có status 'ON' thành công",
  "data": {
    "promotionPrograms": [
      {
        "programId": "PROMO1703123456789",
        "name": "Giảm giá 20% cho mỹ phẩm",
        "condition1": "MIN_ORDER_500K",
        "condition2": "NEW_CUSTOMER",
        "value": "0.20",
        "startDate": "2024-01-01T00:00:00.000Z",
        "endDate": "2024-12-31T23:59:59.000Z",
        "accountId": "ACC001",
        "status": "ON"
      }
    ],
    "pagination": {
      "total": 1,
      "page": 1,
      "limit": 10,
      "totalPages": 1
    }
  }
}
```

### 4. Cập nhật tên promotion program (Role OS)

**PATCH** `/api/promotion-programs/programId?programId=PROMO1703123456789`

**Authentication:** Role `OS`

**Request Body:**

```json
{
  "name": "Tên mới cho chương trình khuyến mãi"
}
```

**Field Validation:**

- `name` (required): Tên mới, không được trống, max 5000 ký tự.

**Response:**

```json
{
  "message": "Cập nhật tên promotion program thành công",
  "data": {
    "programId": "PROMO1703123456789",
    "name": "Tên mới cho chương trình khuyến mãi",
    "condition1": "MIN_ORDER_500K",
    "condition2": "NEW_CUSTOMER",
    "value": "0.20",
    "startDate": "2024-01-01T00:00:00.000Z",
    "endDate": "2024-12-31T23:59:59.000Z",
    "accountId": "ACC001",
    "status": "ON"
  }
}
```

### 5. Tắt một chương trình khuyến mãi (Role OS)

**DELETE** `/api/promotion-programs/programId?programId=PROMO1703123456789`

**Authentication:** Role `OS`

**Chức năng:**
Đây là một "soft-delete". Endpoint này sẽ chuyển `status` của chương trình thành `OFF`.

**Response:**

```json
{
  "message": "Tắt chương trình khuyến mãi thành công",
  "data": {
    "programId": "PROMO1703123456789",
    "name": "Tên mới cho chương trình khuyến mãi",
    "condition1": "MIN_ORDER_500K",
    "condition2": "NEW_CUSTOMER",
    "value": "0.20",
    "startDate": "2024-01-01T00:00:00.000Z",
    "endDate": "2024-12-31T23:59:59.000Z",
    "accountId": "ACC001",
    "status": "OFF"
  }
}
```

## Error Responses

### 400 Bad Request (Validation Errors)

```json
{
  "message": "Tên promotion program không được để trống"
}
```

```json
{
  "message": "Value phải là số dương"
}
```

```json
{
  "message": "startDate phải nhỏ hơn endDate"
}
```

### 401 Unauthorized

```json
{
  "message": "Không có token xác thực"
}
```

### 403 Forbidden

```json
{
  "message": "Không có quyền truy cập"
}
```

### 500 Internal Server Error

```json
{
  "message": "Lỗi server khi tạo promotion program",
  "error": "Error message details"
}
```

### 404 Not Found

```json
{
  "message": "Không tìm thấy promotion program",
  "programId": "PROMO_INVALID"
}
```

```json
{
  "message": "Chương trình khuyến mãi này đã được tắt từ trước."
}
```

```json
{
  "message": "Vui lòng cung cấp programId trong query parameter."
}
```

## Lưu ý

### Cho Role CU (Customer):

- Chỉ có thể xem promotion programs đang hoạt động
- API chỉ trả về các promotion programs đang trong thời gian hoạt động (startDate <= hiện tại <= endDate)

### Cho Role OS (Owner/Staff):

- Có thể tạo mới promotion programs
- Có thể xem tất cả chương trình có status `ON`
- Có thể cập nhật tên của một chương trình
- Có thể tắt một chương trình (chuyển status thành `OFF`)
- `programId` được tự động tạo theo format: `PROMO + timestamp`
- `accountId` được tự động lấy từ JWT token của người tạo
- `status` được mặc định là `ON` khi tạo mới
- `condition2` có thể null
- `value` xác định loại giảm giá:
  - `< 1`: Giảm theo phần trăm (ví dụ: 0.2 = 20%)
  - `>= 1`: Giảm theo số tiền cố định (ví dụ: 50000 = 50,000 VNĐ)
- Kết quả được sắp xếp theo startDate giảm dần (mới nhất trước)
