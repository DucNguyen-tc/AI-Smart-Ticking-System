# API SPECIFICATION

* **Dự án:** AI-Powered Smart Ticketing & CSKH System
* **Phiên bản:** 1.0
* **Trạng thái:** Draft / Contract Baseline

---

## 1. Tổng quan API (Overview)

Tài liệu quy định giao ước truyền nhận dữ liệu (Contract) giữa Client (Customer Portal, CSKH Dashboard, Postman) và Backend API Service.

* **Base URL:**
  * Local: `http://localhost:8080/api/v1`
  * Production: `https://api.ticket.domain.com/api/v1`
* **Data Format:** `application/json`
* **Mã hóa:** `UTF-8`
* **Thời gian:** Chuẩn ISO 8601 (`YYYY-MM-DDTHH:mm:ssZ`)

### Mã Trạng thái HTTP (HTTP Status Codes)

| Status Code | Ý nghĩa | Ngữ cảnh sử dụng |
| :--- | :--- | :--- |
| **200 OK** | Thành công | Trả về dữ liệu truy vấn GET, gửi reply thành công POST. |
| **201 Created** | Khởi tạo thành công | Tạo ticket mới thành công. |
| **400 Bad Request** | Dữ liệu không hợp lệ | Thiếu trường bắt buộc, sai định dạng JSON/Email. |
| **401 Unauthorized** | Chưa xác thực | Thiếu hoặc Sai Auth Token/User ID. |
| **404 Not Found** | Không tìm thấy | `ticket_id` không tồn tại trong DB. |
| **429 Too Many Requests** | Vượt quá Rate Limit | Người dùng/IP gửi quá 5 requests/phút (Redis chặn). |
| **500 Internal Error** | Lỗi máy chủ | Lỗi Database, Redis, RabbitMQ bị sập ngắt kết nối. |

---

## 2. Chuẩn Cấu trúc Response (Standard Response Payload)

Tất cả các API đều phản hồi theo định dạng JSON thống nhất.

### Response thành công (Success Response):
```json
{
  "success": true,
  "code": 200,
  "message": "Mô tả ngắn gọn kết quả",
  "data": {},
  "meta": null
}
```

### Response lỗi (Error Response):
```json
{
  "success": false,
  "code": 400,
  "message": "Nội dung ticket không được để trống",
  "error_code": "INVALID_INPUT",
  "data": null
}
```

---

## 3. Danh sách Endpoint Chi tiết (API Endpoints)

### 3.1. Phân hệ Khách hàng (Customer Endpoints)

#### 1. Tạo Ticket Mới (Create Ticket)
Tiếp nhận yêu cầu từ khách hàng. Trả về ngay lập tức ($< 100\text{ms}$) sau khi lưu DB và phát Event vào RabbitMQ.

* **Endpoint:** `POST /tickets`
* **Rate Limit:** Tối đa 5 requests / phút / User ID (hoặc IP)
* **Request Headers:**
  * `Content-Type: application/json`
  * `X-User-ID: 9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d`

**Request Body:**
```json
{
  "title": "Tôi bị trừ tiền 2 lần nhưng ứng dụng chưa ghi nhận",
  "content": "Vào lúc 9:30 sáng nay tôi thực hiện thanh toán 500k cho đơn hàng, tài khoản ngân hàng báo trừ 2 lần nhưng trạng thái đơn hàng vẫn báo chưa thanh toán. Yêu cầu hỗ trợ gấp!",
  "service_type": "PAYMENT"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "code": 201,
  "message": "Yêu cầu hỗ trợ đã được ghi nhận và đang chờ AI phân tích",
  "data": {
    "ticket_id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
    "user_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "title": "Tôi bị trừ tiền 2 lần nhưng ứng dụng chưa ghi nhận",
    "service_type": "PAYMENT",
    "status": "PENDING",
    "created_at": "2026-08-14T09:42:24Z"
  }
}
```

**Response Error Rate Limit (429 Too Many Requests):**
```json
{
  "success": false,
  "code": 429,
  "message": "Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau 60 giây.",
  "error_code": "RATE_LIMIT_EXCEEDED",
  "data": null
}
```

---

#### 2. Tra cứu Lịch sử Ticket cá nhân (Get Customer Tickets)
Lấy danh sách ticket do người dùng hiện tại đã tạo.

* **Endpoint:** `GET /customer/tickets`
* **Request Headers:**
  * `X-User-ID: 9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d`
* **Query Parameters:**
  * `page` (int, default: 1): Số trang.
  * `limit` (int, default: 10): Số lượng items mỗi trang.

**Response (200 OK):**
```json
{
  "success": true,
  "code": 200,
  "message": "Lấy danh sách ticket thành công",
  "data": [
    {
      "ticket_id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
      "title": "Tôi bị trừ tiền 2 lần nhưng ứng dụng chưa ghi nhận",
      "service_type": "PAYMENT",
      "status": "PROCESSED",
      "created_at": "2026-08-14T09:42:24Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total_records": 1,
    "total_pages": 1
  }
}
```

---

### 3.2. Phân hệ CSKH / Admin Dashboard Endpoints

#### 3. Truy vấn Danh sách Ticket Ưu tiên (Get Priority Ticket List)
Dành cho nhân viên CSKH xem các ticket cần xử lý, mặc định sắp xếp các ticket `URGENT` và cảm xúc `ANGRY` lên đầu. Dữ liệu được đọc qua Redis Cache trước.

* **Endpoint:** `GET /tickets`
* **Query Parameters:**
  * `priority` (string, optional): `URGENT`, `HIGH`, `MEDIUM`, `LOW`
  * `sentiment` (string, optional): `ANGRY`, `NEUTRAL`, `POSITIVE`
  * `status` (string, optional): `PENDING`, `PROCESSED`, `RESOLVED`, `CLOSED`
  * `category` (string, optional): `REFUND`, `TECHNICAL_BUG`, `SHIPPING`, `FAQ`
  * `page` (int, default: 1)
  * `limit` (int, default: 20)

**Response (200 OK):**
```json
{
  "success": true,
  "code": 200,
  "message": "Lấy danh sách ticket cho CSKH thành công",
  "data": [
    {
      "ticket_id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
      "user_name": "Nguyễn Văn A",
      "user_email": "nguyenvana@gmail.com",
      "title": "Tôi bị trừ tiền 2 lần nhưng ứng dụng chưa ghi nhận",
      "service_type": "PAYMENT",
      "status": "PROCESSED",
      "created_at": "2026-08-14T09:42:24Z",
      "ai_analysis": {
        "sentiment": "ANGRY",
        "priority": "URGENT",
        "category": "REFUND",
        "summary": "Khách hàng bị trừ tiền 2 lần cho 1 đơn hàng thanh toán qua cổng thanh toán.",
        "confidence_score": 0.95
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total_records": 45,
    "total_pages": 3
  }
}
```

---

#### 4. Xem Chi tiết Ticket & Kết quả AI (Get Ticket Details)
Trả về toàn bộ thông tin ticket, kết quả phân tích sâu từ AI (bao gồm `suggested_reply`) và lịch sử phản hồi.

* **Endpoint:** `GET /tickets/{id}`

**Response (200 OK):**
```json
{
  "success": true,
  "code": 200,
  "message": "Chi tiết ticket",
  "data": {
    "ticket_id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
    "user": {
      "id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      "name": "Nguyễn Văn A",
      "email": "nguyenvana@gmail.com"
    },
    "title": "Tôi bị trừ tiền 2 lần nhưng ứng dụng chưa ghi nhận",
    "content": "Vào lúc 9:30 sáng nay tôi thực hiện thanh toán 500k cho đơn hàng, tài khoản ngân hàng báo trừ 2 lần nhưng trạng thái đơn hàng vẫn báo chưa thanh toán. Yêu cầu hỗ trợ gấp!",
    "service_type": "PAYMENT",
    "status": "PROCESSED",
    "created_at": "2026-08-14T09:42:24Z",
    "ai_analysis": {
      "sentiment": "ANGRY",
      "priority": "URGENT",
      "category": "REFUND",
      "summary": "Khách hàng bị trừ tiền 2 lần cho 1 đơn hàng thanh toán qua cổng thanh toán.",
      "suggested_reply": "Chào anh/chị Nguyễn Văn A, em rất tiếc về sự cố thanh toán trùng lặp này. Hệ thống đã ghi nhận giao dịch của anh/chị. Bộ phận Kế toán đang đối soát và sẽ hoàn lại số tiền 500.000 VNĐ bị trừ thừa vào tài khoản ngân hàng của anh/chị trong vòng 24h làm việc. Rất mong anh/chị thông cảm!",
      "confidence_score": 0.95,
      "processed_at": "2026-08-14T09:42:26Z"
    },
    "replies": []
  }
}
```

---

#### 5. CSKH Gửi Phản hồi Khách hàng (Reply Ticket)
Nhân viên CSKH duyệt câu trả lời (hoặc chỉnh sửa lại câu trả lời do AI gợi ý) và bấm gửi. Trạng thái ticket tự động chuyển sang `RESOLVED`.

* **Endpoint:** `POST /tickets/{id}/reply`

**Request Body:**
```json
{
  "message": "Chào anh A, bên em đã xác nhận giao dịch bị trùng và làm thủ tục hoàn 500.000đ về tài khoản ngân hàng của anh trong 24h tới. Em cảm ơn anh!",
  "is_internal_note": false
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "code": 200,
  "message": "Đã gửi phản hồi cho khách hàng thành công",
  "data": {
    "reply_id": "f9e8d7c6-b5a4-3f2e-1d0c-9b8a7f6e5d4c",
    "ticket_id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
    "sender_id": "c0a80101-0000-0000-0000-000000000001",
    "message": "Chào anh A, bên em đã xác nhận giao dịch bị trùng và làm thủ tục hoàn 500.000đ về tài khoản ngân hàng của anh trong 24h tới. Em cảm ơn anh!",
    "is_internal_note": false,
    "new_ticket_status": "RESOLVED",
    "created_at": "2026-08-14T09:50:00Z"
  }
}
```

---

### 3.3. Phân hệ Thư viện Tri thức (FAQ Endpoints)

#### 6. Lấy Danh sách FAQ (Get FAQs List)
Lấy danh sách các câu hỏi thường gặp. Kết quả được Cache 1 giờ trên Redis.

* **Endpoint:** `GET /faqs`
* **Query Parameters:**
  * `category` (string, optional): `PAYMENT`, `ECOMMERCE`, `SOFTWARE`

**Response (200 OK):**
```json
{
  "success": true,
  "code": 200,
  "message": "Danh sách FAQ",
  "data": [
    {
      "id": "e4d3c2b1-a0f9-8e7d-6c5b-4a3f2e1d0c9b",
      "question": "Làm sao để yêu cầu hoàn tiền khi hủy đơn?",
      "answer": "Bạn vào mục Đơn hàng của tôi -> Chọn Hủy đơn -> Tiền sẽ được tự động hoàn về ví/thẻ trong 3-5 ngày.",
      "category": "REFUND"
    }
  ]
}
```
