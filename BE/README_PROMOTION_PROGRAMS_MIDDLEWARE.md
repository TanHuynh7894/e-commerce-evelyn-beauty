# Promotion Programs Middleware

## Tổng quan

File `promotionPrograms.middlewares.js` chứa các middleware hỗ trợ xử lý request cho promotion programs.

## Các Middleware

### 1. `paginate`

**Mục đích**: Xử lý phân trang cho promotion programs

**Chức năng**:

- Lấy `page` và `limit` từ query parameters
- Tính toán `offset` cho database query
- Lưu thông tin pagination vào `req.pagination`

**Sử dụng**:

```javascript
router.get("/", paginate, controller.getActivePromotionPrograms);
```

### 2. `validatePagination`

**Mục đích**: Validate các tham số phân trang

**Chức năng**:

- Kiểm tra `page` phải là số nguyên dương
- Kiểm tra `limit` phải từ 1 đến 100
- Trả về lỗi 400 nếu tham số không hợp lệ

**Validation Rules**:

- `page`: Phải là số nguyên dương
- `limit`: Phải từ 1 đến 100

**Sử dụng**:

```javascript
router.get(
  "/",
  validatePagination,
  paginate,
  controller.getActivePromotionPrograms
);
```

### 3. `logPromotionProgramRequest`

**Mục đích**: Log thông tin request cho debug

**Chức năng**:

- Log method và URL của request
- Log thông tin user (nếu có)
- Hỗ trợ debug và monitoring

**Output**:

```
[PromotionProgram Middleware] GET /api/promotion-programs
[PromotionProgram Middleware] User: ACC001
```

**Sử dụng**:

```javascript
router.get(
  "/",
  logPromotionProgramRequest,
  controller.getActivePromotionPrograms
);
```

### 4. `checkPromotionProgramExists`

**Mục đích**: Kiểm tra promotion program có tồn tại không

**Chức năng**:

- Lấy `programId` từ params
- Kiểm tra promotion program trong database
- Lưu promotion program vào `req.promotionProgram` nếu tìm thấy
- Trả về lỗi 404 nếu không tìm thấy

**Sử dụng**:

```javascript
router.get(
  "/:programId",
  checkPromotionProgramExists,
  controller.getPromotionProgramById
);
```

### 5. `checkPromotionProgramActive`

**Mục đích**: Kiểm tra promotion program có đang hoạt động không

**Chức năng**:

- Kiểm tra `startDate` và `endDate` của promotion program
- Trả về lỗi nếu chưa bắt đầu hoặc đã kết thúc
- Yêu cầu `req.promotionProgram` từ middleware trước

**Validation Rules**:

- `startDate` <= hiện tại
- `endDate` >= hiện tại

**Sử dụng**:

```javascript
router.get(
  "/:programId",
  checkPromotionProgramExists,
  checkPromotionProgramActive,
  controller.getPromotionProgramById
);
```

## Thứ tự Middleware

### Cho endpoint lấy danh sách:

```javascript
router.get(
  "/",
  verifyToken, // 1. Xác thực JWT
  requireRole("CU"), // 2. Kiểm tra role
  logPromotionProgramRequest, // 3. Log request
  validatePagination, // 4. Validate pagination
  paginate, // 5. Tính toán pagination
  controller.getActivePromotionPrograms // 6. Controller
);
```

### Cho endpoint lấy theo ID:

```javascript
router.get(
  "/:programId",
  verifyToken, // 1. Xác thực JWT
  requireRole("CU"), // 2. Kiểm tra role
  checkPromotionProgramExists, // 3. Kiểm tra tồn tại
  checkPromotionProgramActive, // 4. Kiểm tra trạng thái
  controller.getPromotionProgramById // 5. Controller
);
```

## Error Responses

### 400 Bad Request (validatePagination)

```json
{
  "message": "Số trang phải là số nguyên dương"
}
```

### 404 Not Found (checkPromotionProgramExists)

```json
{
  "message": "Không tìm thấy promotion program",
  "programId": "PROMO999"
}
```

### 400 Bad Request (checkPromotionProgramActive)

```json
{
  "message": "Promotion program chưa bắt đầu",
  "startDate": "2024-12-01T00:00:00.000Z"
}
```

## Lưu ý

- Middleware `checkPromotionProgramActive` phải được sử dụng sau `checkPromotionProgramExists`
- Tất cả middleware đều có error handling
- Middleware `logPromotionProgramRequest` chỉ dùng cho debug, có thể bỏ trong production
