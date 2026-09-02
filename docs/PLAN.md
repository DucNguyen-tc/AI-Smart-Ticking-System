# KẾ HOẠCH TRIỂN KHAI CHI TIẾT (IMPLEMENTATION PLAN)

- **Dự án:** AI-Powered Smart Ticketing & CSKH System
- **Phiên bản:** 1.0
- **Tech Stack đã chốt:** Node.js (Express) cho Backend API + Python cho AI Worker
- **Ngày lập:** 2026-08-14

---

## Quy ước

- ✅ = Tiêu chí nghiệm thu (Acceptance Criteria) — phải đạt để đánh dấu hoàn thành.
- 📁 = File/thư mục cần tạo hoặc chỉnh sửa.
- 💻 = Lệnh cần chạy.
- 🔗 = Tham chiếu tài liệu thiết kế.

---

## Giai đoạn 1: Thiết kế, Môi trường & Nền tảng Dữ liệu

> **Mục tiêu:** Xây dựng nền móng hạ tầng phụ trợ (PostgreSQL, Redis, RabbitMQ) chạy local bằng Docker Compose, khởi tạo Database Schema, và setup cấu trúc thư mục dự án.
>
> **Công nghệ tích hợp:** Linux, Docker, Database

### Task 1.1: Khởi tạo Repository & Cấu trúc Thư mục

📁 Tạo cấu trúc thư mục chuẩn:

```
smart-ticketing-system/
├── .github/
│   └── workflows/           # CI/CD pipeline (Giai đoạn 4)
├── docs/                    # Tài liệu thiết kế (đã có)
│   ├── REQUIREMENTS.md
│   ├── ARCHITECTURE.md
│   ├── DATABASE_DESIGN.md
│   ├── API_SPECIFICATION.md
│   ├── DEPLOYMENT_PLAN.md
│   └── PLAN.md
├── src/
│   ├── backend/             # Node.js Express API Service
│   │   ├── package.json
│   │   ├── .env.example
│   │   └── ...
│   └── worker/              # Python AI Worker Service
│       ├── requirements.txt
│       ├── .env.example
│       └── ...
├── nginx/                   # Nginx reverse proxy config (Giai đoạn 6)
├── scripts/                 # Helper scripts (seed data, migration)
│   └── seed.sql
├── docker-compose.yml       # Hạ tầng local
├── .gitignore
└── README.md
```

**Các bước thực hiện:**

1. Tạo thư mục `src/backend/`, `src/worker/`, `nginx/`, `scripts/`.
2. Tạo file `.gitignore` (ignore `node_modules/`, `__pycache__/`, `.env`, `*.pyc`).
3. Cập nhật `README.md` với mô tả dự án, hướng dẫn chạy local.

✅ **Nghiệm thu:** Cấu trúc thư mục khớp với sơ đồ trên. `git status` hiển thị các thư mục và file mới.

---

### Task 1.2: Thiết lập Docker Compose cho Hạ tầng Phụ trợ

📁 Tạo file `docker-compose.yml` tại thư mục gốc.

**Chi tiết cấu hình 3 service:**

| Service      | Image                             | Ports                      | Volumes                           | Env Vars                                                                                          |
| :----------- | :-------------------------------- | :------------------------- | :-------------------------------- | :------------------------------------------------------------------------------------------------ |
| **postgres** | `postgres:16-alpine`              | `5432:5432`                | `pgdata:/var/lib/postgresql/data` | `POSTGRES_USER=postgres_admin`, `POSTGRES_PASSWORD=SecretDBPass2026!`, `POSTGRES_DB=ticketing_db` |
| **redis**    | `redis:7-alpine`                  | `6379:6379`                | —                                 | —                                                                                                 |
| **rabbitmq** | `rabbitmq:3.13-management-alpine` | `5672:5672`, `15672:15672` | —                                 | `RABBITMQ_DEFAULT_USER=admin`, `RABBITMQ_DEFAULT_PASS=admin123`                                   |

**Thêm health checks cho từng service:**

- PostgreSQL: `pg_isready -U postgres_admin`
- Redis: `redis-cli ping`
- RabbitMQ: `rabbitmq-diagnostics -q ping`

**Cấu hình network:** Tạo Docker network `ticketing-network` (bridge) để các container giao tiếp.

💻 Chạy kiểm tra:

```bash
docker compose up -d
docker compose ps          # Kiểm tra 3 service đều "healthy"
docker exec -it <postgres_container> psql -U postgres_admin -d ticketing_db -c "SELECT 1;"
docker exec -it <redis_container> redis-cli ping
```

✅ **Nghiệm thu:**

- `docker compose ps` hiển thị 3 container đều ở trạng thái `Up (healthy)`.
- Kết nối thành công vào PostgreSQL từ terminal (`psql`).
- Redis trả về `PONG`.
- RabbitMQ Management UI truy cập được tại `http://localhost:15672`.

---

### Task 1.3: Khởi tạo Database Schema (SQL DDL)

📁 Tạo file `scripts/init.sql` chứa toàn bộ DDL script.
🔗 Tham chiếu: [DATABASE_DESIGN.md - Mục 4](./DATABASE_DESIGN.md)

**Nội dung script bao gồm:**

1. Enable extension `uuid-ossp`.
2. Tạo 5 bảng: `users`, `tickets`, `ai_analyses`, `replies`, `faqs` (đúng schema trong tài liệu).
3. Tạo 4 indexes: `idx_tickets_user_id`, `idx_tickets_status_created`, `idx_ai_analyses_ticket_id`, `idx_ai_analyses_priority`.

📁 Tạo file `scripts/seed.sql` chứa dữ liệu mẫu:

- 3 users mẫu: 1 CUSTOMER, 1 AGENT, 1 ADMIN.
- 5 FAQs mẫu: 2 REFUND, 1 ECOMMERCE, 1 SOFTWARE, 1 PAYMENT.

**Tích hợp với Docker Compose:**

- Mount thư mục `scripts/` vào PostgreSQL container tại `/docker-entrypoint-initdb.d/` để tự động chạy DDL khi khởi tạo lần đầu.

💻 Chạy kiểm tra:

```bash
docker compose down -v     # Xóa volume cũ
docker compose up -d       # Khởi tạo lại từ đầu
docker exec -it <postgres> psql -U postgres_admin -d ticketing_db -c "\dt"
docker exec -it <postgres> psql -U postgres_admin -d ticketing_db -c "\di"
docker exec -it <postgres> psql -U postgres_admin -d ticketing_db -c "SELECT * FROM users;"
```

✅ **Nghiệm thu:**

- `\dt` hiển thị đúng 5 bảng.
- `\di` hiển thị đúng 4 indexes + các indexes PK/UK mặc định.
- `SELECT * FROM users;` trả về 3 bản ghi mẫu.
- `SELECT * FROM faqs;` trả về 5 bản ghi mẫu.

---

## Giai đoạn 2: Phát triển Core Backend API (Node.js / Express)

> **Mục tiêu:** Xây dựng Backend REST API Service hoàn chỉnh với kiến trúc Layered Architecture, kết nối PostgreSQL & Redis, bao gồm Rate Limiting và Caching.
>
> **Công nghệ tích hợp:** Backend (Node.js), Database (PostgreSQL), Redis

### Task 2.1: Khởi tạo Dự án Node.js & Cấu trúc Mã nguồn

📁 Cấu trúc thư mục `src/backend/`:

```
src/backend/
├── package.json
├── .env.example              # Template biến môi trường
├── .env                      # (gitignored) Biến môi trường local
├── src/
│   ├── index.js              # Entry point: khởi tạo Express server
│   ├── config/
│   │   ├── database.js       # Cấu hình PostgreSQL connection pool
│   │   ├── redis.js          # Cấu hình Redis client
│   │   └── rabbitmq.js       # Cấu hình RabbitMQ connection (Giai đoạn 3)
│   ├── routes/
│   │   ├── ticketRoutes.js   # Router cho /api/v1/tickets
│   │   ├── customerRoutes.js # Router cho /api/v1/customer/tickets
│   │   └── faqRoutes.js      # Router cho /api/v1/faqs
│   ├── controllers/
│   │   ├── ticketController.js
│   │   ├── customerController.js
│   │   └── faqController.js
│   ├── services/
│   │   ├── ticketService.js
│   │   └── faqService.js
│   ├── repositories/
│   │   ├── ticketRepository.js  # Raw SQL queries cho tickets + ai_analyses
│   │   ├── userRepository.js    # Raw SQL queries cho users
│   │   ├── replyRepository.js   # Raw SQL queries cho replies
│   │   └── faqRepository.js     # Raw SQL queries cho faqs
│   ├── middlewares/
│   │   ├── rateLimiter.js       # Redis-based rate limiting
│   │   ├── errorHandler.js      # Global error handler
│   │   └── validator.js         # Request body validation
│   ├── utils/
│   │   └── response.js         # Standard response builder (success/error)
│   └── __tests__/               # Unit & Integration Tests (Giai đoạn 2)
│       ├── ticketController.test.js
│       └── rateLimiter.test.js
└── jest.config.js               # Jest test configuration
```

💻 Khởi tạo:

```bash
cd src/backend
npm init -y
npm install express pg redis dotenv cors helmet
npm install -D jest nodemon supertest
```

📁 Cấu hình `.env.example`:

```env
PORT=3000
NODE_ENV=development

# PostgreSQL
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=ticketing_db
POSTGRES_USER=postgres_admin
POSTGRES_PASSWORD=SecretDBPass2026!

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# RabbitMQ (Giai đoạn 3)
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USER=admin
RABBITMQ_PASSWORD=admin123
```

📁 Cấu hình `package.json` scripts:

```json
{
  "scripts": {
    "dev": "nodemon src/index.js",
    "start": "node src/index.js",
    "test": "jest --coverage --verbose"
  }
}
```

✅ **Nghiệm thu:**

- `npm run dev` khởi động server Express tại `http://localhost:3000`.
- `GET http://localhost:3000/api/v1/health` trả về `{"success": true, "message": "OK"}`.
- Kết nối PostgreSQL pool hoạt động (log "Database connected" khi startup).
- Kết nối Redis client hoạt động (log "Redis connected" khi startup).

---

### Task 2.2: Xây dựng Utility & Middleware cơ bản

📁 File `src/utils/response.js` — Standard Response Builder:
🔗 Tham chiếu: [API_SPECIFICATION.md - Mục 2](./API_SPECIFICATION.md)

```javascript
// Hàm tạo response thành công:
// successResponse(res, statusCode, message, data, meta)

// Hàm tạo response lỗi:
// errorResponse(res, statusCode, message, errorCode)
```

📁 File `src/middlewares/errorHandler.js` — Global Error Handler:

- Bắt tất cả lỗi chưa xử lý, log stack trace, trả về JSON format chuẩn.

📁 File `src/middlewares/validator.js` — Request Validation:

- Validate `POST /tickets`: `title` (required, max 255), `content` (required), `service_type` (optional, enum: ECOMMERCE, SOFTWARE, PAYMENT, GENERAL).
- Validate `POST /tickets/:id/reply`: `message` (required), `is_internal_note` (optional, boolean).

✅ **Nghiệm thu:**

- Gửi request thiếu `title` → nhận response `400 Bad Request` với `error_code: "INVALID_INPUT"`.
- Gửi request đúng format → không bị chặn bởi validator.

---

### Task 2.3: Xây dựng API Endpoints — Phân hệ Khách hàng

🔗 Tham chiếu: [API_SPECIFICATION.md - Mục 3.1](./API_SPECIFICATION.md)

**Endpoint 1: `POST /api/v1/tickets` — Tạo Ticket Mới**

- **Controller:** Nhận `X-User-ID` từ header, validate body.
- **Service:** Kiểm tra user tồn tại → Ghi ticket vào DB (status: `PENDING`) → Return ticket_id.
- **Repository:** `INSERT INTO tickets (...) RETURNING *`.
- _(Chưa tích hợp RabbitMQ — sẽ bổ sung ở Giai đoạn 3)._

**Endpoint 2: `GET /api/v1/customer/tickets` — Lịch sử Ticket cá nhân**

- **Controller:** Nhận `X-User-ID` từ header, parse `page` & `limit` từ query params.
- **Service:** Truy vấn danh sách ticket theo `user_id`, phân trang.
- **Repository:** `SELECT * FROM tickets WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`.

📁 **Unit Tests** (`src/__tests__/ticketController.test.js`):

- Test tạo ticket thành công → 201 Created.
- Test tạo ticket thiếu title → 400 Bad Request.
- Test lấy danh sách ticket → 200 OK, đúng format pagination meta.

💻 Chạy test:

```bash
cd src/backend
npm test
```

✅ **Nghiệm thu:**

- `POST /api/v1/tickets` với body hợp lệ → `201 Created`, trả về `ticket_id` (UUID).
- `GET /api/v1/customer/tickets` → `200 OK` với `data: [...]` và `meta: {page, limit, total_records, total_pages}`.
- Tất cả unit tests PASS.

---

### Task 2.4: Xây dựng API Endpoints — Phân hệ CSKH / Admin

🔗 Tham chiếu: [API_SPECIFICATION.md - Mục 3.2](./API_SPECIFICATION.md)

**Endpoint 3: `GET /api/v1/tickets` — Danh sách Ticket Ưu tiên**

- **Service:** Query tickets LEFT JOIN ai_analyses, hỗ trợ filter theo `priority`, `sentiment`, `status`, `category`, phân trang.
- **Repository:** Dynamic query builder với WHERE clauses tùy theo params.

**Endpoint 4: `GET /api/v1/tickets/:id` — Chi tiết Ticket + AI**

- **Service:** Query ticket + LEFT JOIN ai_analyses + danh sách replies (LEFT JOIN users lấy sender info).
- **Repository:** 2 queries: 1 cho ticket+analysis, 1 cho replies.

**Endpoint 5: `POST /api/v1/tickets/:id/reply` — Gửi Phản hồi**

- **Service:** Ghi reply vào bảng `replies` → Cập nhật ticket status sang `RESOLVED` (nếu `is_internal_note = false`).
- **Repository:** Transaction gồm 2 queries: INSERT reply + UPDATE ticket status.

📁 **Unit Tests** — bổ sung vào test suite:

- Test lấy danh sách ticket với filter priority=URGENT → chỉ trả về ticket URGENT.
- Test xem chi tiết ticket → đầy đủ `ai_analysis` và `replies` (nếu có).
- Test reply ticket → status chuyển thành RESOLVED.
- Test reply ticket không tồn tại → 404 Not Found.

✅ **Nghiệm thu:**

- `GET /api/v1/tickets?priority=URGENT&page=1&limit=20` trả về danh sách ticket đúng filter.
- `GET /api/v1/tickets/:id` trả về JSON chứa cả `ai_analysis` và `replies`.
- `POST /api/v1/tickets/:id/reply` → reply được tạo, ticket status = RESOLVED.
- Tất cả unit tests PASS.

---

### Task 2.5: Xây dựng API Endpoint — Phân hệ FAQ

🔗 Tham chiếu: [API_SPECIFICATION.md - Mục 3.3](./API_SPECIFICATION.md)

**Endpoint 6: `GET /api/v1/faqs` — Danh sách FAQ**

- **Service:** Query `SELECT * FROM faqs WHERE is_active = true`, lọc theo `category` nếu có.
- **Cache Logic:** Kiểm tra Redis key `cache:faqs:all` trước → Cache Hit thì return ngay, Cache Miss thì query DB rồi SET vào Redis với TTL 3600s.

✅ **Nghiệm thu:**

- Request lần 1 (Cache Miss) → query DB, trả về FAQs, cache được lưu vào Redis.
- Request lần 2 (Cache Hit) → trả về từ Redis, **không** query DB.
- `GET /api/v1/faqs?category=PAYMENT` → chỉ trả về FAQ thuộc category PAYMENT.

---

### Task 2.6: Tích hợp Redis Rate Limiter Middleware

🔗 Tham chiếu: [DATABASE_DESIGN.md - Mục 5.2](./DATABASE_DESIGN.md) (Redis Strategy)

📁 File `src/middlewares/rateLimiter.js`:

**Logic Fixed Window Counter:**

1. Đọc `X-User-ID` từ header (hoặc fallback sang IP address).
2. Tạo Redis key: `rate_limit:user:{user_id}` hoặc `rate_limit:ip:{ip}`.
3. `INCR` key → nếu giá trị trả về `> 5` → return `429 Too Many Requests`.
4. Nếu key vừa mới được tạo (giá trị = 1) → `EXPIRE` key sau 60 giây.

**Áp dụng middleware:**

- Gắn vào route `POST /api/v1/tickets` (là route cần bảo vệ nhất).

📁 **Unit Tests** (`src/__tests__/rateLimiter.test.js`):

- Gửi 5 requests liên tiếp → tất cả trả về 201.
- Gửi request thứ 6 → trả về 429 với `error_code: "RATE_LIMIT_EXCEEDED"`.
- Chờ 60s (mock) → gửi lại → trả về 201.

✅ **Nghiệm thu:**

- Rate Limiter chặn chính xác request thứ 6 trong cùng 1 phút.
- Response 429 đúng format chuẩn: `{ success: false, code: 429, error_code: "RATE_LIMIT_EXCEEDED" }`.
- Tất cả unit tests PASS.

---

## Giai đoạn 3: Tích hợp Asynchronous Worker & Trí tuệ Nhân tạo

> **Mục tiêu:** Triển khai kiến trúc Event-Driven bằng RabbitMQ. Xây dựng AI Worker Service (Python) gọi Gemini API phân tích ticket bất đồng bộ.
>
> **Công nghệ tích hợp:** Message Queue (RabbitMQ), AI Integration (Gemini), System Design (Async, Retry, DLQ)

### Task 3.1: Cấu hình RabbitMQ Producer trong Backend (Node.js)

📁 File `src/backend/src/config/rabbitmq.js`:

- Kết nối RabbitMQ bằng thư viện `amqplib`.
- Khai báo Exchange: `ticket.direct.exchange` (type: direct).
- Khai báo Queue: `ticket.process.queue` (durable: true).
- Khai báo Dead Letter Queue: `ticket.dlq` (durable: true).
- Binding: `ticket.process.queue` ← `ticket.direct.exchange` với routing key `ticket.created.key`.
- Cấu hình DLQ: Thêm argument `x-dead-letter-exchange` và `x-dead-letter-routing-key` vào queue chính.
- Cấu hình Max Retry: `x-message-ttl` (optional) và `x-max-retries: 3`.

💻 Cài thêm dependency:

```bash
cd src/backend
npm install amqplib
```

📁 Cập nhật `src/backend/src/services/ticketService.js`:

- Sau khi INSERT ticket thành công → Publish message `{ ticket_id: "..." }` vào exchange với routing key `ticket.created.key`.
- Log message: `"Published TICKET_CREATED event for ticket_id: xxx"`.

✅ **Nghiệm thu:**

- `POST /api/v1/tickets` → ticket được lưu DB **VÀ** message xuất hiện trong RabbitMQ Queue.
- Kiểm tra qua Management UI (`http://localhost:15672`): Queue `ticket.process.queue` có 1 message ready.
- Queue `ticket.dlq` đã được khai báo (0 message).

---

### Task 3.2: Khởi tạo AI Worker Service (Python)

📁 Cấu trúc thư mục `src/worker/`:

```
src/worker/
├── requirements.txt
├── .env.example
├── .env                    # (gitignored)
├── worker.py               # Entry point: main consumer loop
├── config.py               # Đọc biến môi trường
├── gemini_client.py        # Wrapper gọi Gemini API
├── db_client.py            # PostgreSQL connection (psycopg2)
├── redis_client.py         # Redis connection
├── prompt_template.py      # Prompt chuẩn hóa cho Gemini
├── message_handler.py      # Xử lý logic khi nhận message từ queue
└── tests/
    ├── test_message_handler.py
    └── test_gemini_client.py
```

📁 File `requirements.txt`:

```
pika==1.3.2
google-generativeai==0.8.0
psycopg2-binary==2.9.9
redis==5.0.8
python-dotenv==1.0.1
pytest==8.3.2
```

📁 File `.env.example`:

```env
# PostgreSQL
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=ticketing_db
POSTGRES_USER=postgres_admin
POSTGRES_PASSWORD=SecretDBPass2026!

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# RabbitMQ
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USER=admin
RABBITMQ_PASSWORD=admin123

# Gemini API
GEMINI_API_KEY=your_gemini_api_key_here
```

💻 Setup:

```bash
cd src/worker
python -m venv venv
source venv/bin/activate    # Linux/WSL
pip install -r requirements.txt
```

✅ **Nghiệm thu:**

- `python worker.py` khởi chạy, log `"Worker started. Waiting for messages..."`.
- Worker kết nối thành công vào RabbitMQ và bắt đầu lắng nghe queue `ticket.process.queue`.
- Khi nhận được message → log `"Received message for ticket_id: xxx"`.

---

### Task 3.3: Tích hợp Gemini 1.5 Flash API & Prompt Engineering

📁 File `src/worker/prompt_template.py`:

**Thiết kế Prompt chuẩn hóa:**

```python
ANALYSIS_PROMPT = """
Bạn là một AI chuyên gia phân tích ticket hỗ trợ khách hàng.
Phân tích nội dung ticket sau và trả về kết quả dưới dạng JSON:

Ticket Title: {title}
Ticket Content: {content}
Service Type: {service_type}

Trả về JSON với các trường:
- "sentiment": một trong ["POSITIVE", "NEUTRAL", "ANGRY"]
- "priority": một trong ["LOW", "MEDIUM", "HIGH", "URGENT"]
- "category": một trong ["REFUND", "TECHNICAL_BUG", "SHIPPING", "FAQ"]
- "summary": tóm tắt nội dung ticket trong 1-2 câu
- "suggested_reply": câu trả lời chuyên nghiệp gợi ý cho nhân viên CSKH
- "confidence_score": độ tin cậy từ 0.00 đến 1.00

Chỉ trả về JSON, không thêm text nào khác.
"""
```

📁 File `src/worker/gemini_client.py`:

- Khởi tạo `genai.configure(api_key=...)`.
- Sử dụng model `gemini-1.5-flash`.
- Hàm `analyze_ticket(title, content, service_type)` → gọi API → parse JSON response.
- **Error Handling:** Bắt `google.api_core.exceptions.ResourceExhausted` (HTTP 429) → raise custom exception để trigger retry.

📁 File `src/worker/message_handler.py` — Logic xử lý chính:

1. Parse message body → lấy `ticket_id`.
2. Query PostgreSQL: `SELECT title, content, service_type FROM tickets WHERE id = $1`.
3. Gọi `gemini_client.analyze_ticket(...)`.
4. Parse kết quả JSON từ Gemini.
5. `INSERT INTO ai_analyses (ticket_id, sentiment, priority, ...) VALUES (...)`.
6. `UPDATE tickets SET status = 'PROCESSED', updated_at = NOW() WHERE id = $1`.
7. Invalidate Redis cache: `DEL cache:tickets:priority_list`.

📁 File `src/worker/worker.py` — Consumer Loop:

- Kết nối RabbitMQ, consume queue `ticket.process.queue`.
- **Auto-ack = False** (Manual Acknowledgement).
- **Retry Logic (Exponential Backoff):**
  - Lần 1: chờ 2s → retry.
  - Lần 2: chờ 4s → retry.
  - Lần 3: chờ 8s → retry.
  - Lần 4: Reject message → message tự động đi vào DLQ (`ticket.dlq`).
- Retry count được lưu trong message header `x-retry-count`.

✅ **Nghiệm thu:**

- Tạo 1 ticket mới qua API → Message vào queue → Worker consume → Gemini API được gọi → Kết quả phân tích lưu vào bảng `ai_analyses` → Ticket status = `PROCESSED`.
- Kiểm tra `GET /api/v1/tickets/:id` → trường `ai_analysis` có đầy đủ: sentiment, priority, category, summary, suggested_reply, confidence_score.
- **Test retry:** Tắt mạng (mock Gemini lỗi) → Worker retry 3 lần với backoff → Lần 4 message vào DLQ.
- Kiểm tra RabbitMQ Management UI: Queue `ticket.dlq` có 1 message (message lỗi).

---

### Task 3.4: Viết Tests cho AI Worker

📁 File `src/worker/tests/test_message_handler.py`:

- **Mock Gemini API** response → test toàn bộ flow message_handler mà không gọi API thật.
- Test case: ticket "bị trừ tiền 2 lần" → sentiment = ANGRY, priority = URGENT.
- Test case: ticket "hỏi cách đổi mật khẩu" → category = FAQ, priority = LOW.

📁 File `src/worker/tests/test_gemini_client.py`:

- Test parse JSON response hợp lệ từ Gemini.
- Test xử lý khi Gemini trả về response không hợp lệ (non-JSON) → raise exception.

💻 Chạy test:

```bash
cd src/worker
python -m pytest tests/ -v
```

✅ **Nghiệm thu:** Tất cả Python tests PASS.

---

## Giai đoạn 4: Phát triển Frontend (React / Vite / Tailwind CSS / shadcn/ui)

> **Mục tiêu:** Xây dựng giao diện người dùng cho 2 phân hệ: Customer Portal (gửi & tra cứu ticket) và CSKH Dashboard (quản lý ticket, xem AI analysis, phản hồi khách hàng). Phong cách thiết kế SaaS Minimal hiện đại (Dark/Light theme).
>
> **Công nghệ tích hợp:** Frontend (React, Vite, Tailwind CSS, shadcn/ui, Zustand, React Router DOM), System Design (UI/UX)

🔗 Tham chiếu: [FRONTEND_DESIGN.md](./FRONTEND_DESIGN.md)

### Task 4.1: Khởi tạo Dự án Frontend (React + Vite)

💻 Khởi tạo:

```bash
cd src
npx -y create-vite@latest frontend --template react
cd frontend
npm install react-router-dom zustand
npm install -D tailwindcss @tailwindcss/vite
npx shadcn@latest init
```

📁 Cấu trúc thư mục `src/frontend/`:

```
src/frontend/
├── package.json
├── vite.config.js                   # Vite config (alias @/, proxy)
├── tailwind.config.js               # Tailwind CSS config
├── postcss.config.js                # PostCSS config
├── components.json                  # shadcn/ui config
├── index.html                       # Vite entry HTML
├── public/
│   ├── favicon.ico
│   └── logo.svg
├── src/
│   ├── main.jsx                     # React entry point (ReactDOM.createRoot)
│   ├── App.jsx                      # Root component (BrowserRouter + Routes)
│   ├── pages/                       # Page components (React Router)
│   │   ├── LandingPage.jsx          # Route: /
│   │   ├── SubmitTicketPage.jsx     # Route: /submit-ticket
│   │   ├── SubmitSuccessPage.jsx    # Route: /submit-ticket/success
│   │   ├── TrackTicketPage.jsx      # Route: /track
│   │   ├── TicketDetailPage.jsx     # Route: /track/:id
│   │   ├── FAQPage.jsx              # Route: /faq
│   │   └── agent/
│   │       ├── AgentLoginPage.jsx   # Route: /agent/login
│   │       ├── DashboardPage.jsx    # Route: /agent/dashboard
│   │       ├── AgentTicketDetailPage.jsx  # Route: /agent/tickets/:id
│   │       └── ManageFAQPage.jsx    # Route: /agent/faqs
│   ├── layouts/                     # Layout wrappers
│   │   ├── CustomerLayout.jsx       # Header + Footer cho Customer Portal
│   │   └── AgentLayout.jsx          # Dashboard shell (Sidebar + TopBar)
│   ├── components/
│   │   ├── ui/                      # shadcn/ui components (auto-generated)
│   │   │   ├── button.jsx
│   │   │   ├── input.jsx
│   │   │   ├── textarea.jsx
│   │   │   ├── select.jsx
│   │   │   ├── badge.jsx
│   │   │   ├── card.jsx
│   │   │   ├── table.jsx
│   │   │   ├── dialog.jsx
│   │   │   ├── sheet.jsx
│   │   │   ├── skeleton.jsx
│   │   │   ├── avatar.jsx
│   │   │   ├── tabs.jsx
│   │   │   ├── tooltip.jsx
│   │   │   ├── checkbox.jsx
│   │   │   ├── label.jsx
│   │   │   ├── separator.jsx
│   │   │   ├── sonner.jsx           # Toast (Sonner)
│   │   │   ├── dropdown-menu.jsx
│   │   │   └── pagination.jsx
│   │   ├── custom/                  # Custom reusable components
│   │   │   ├── Sidebar.jsx
│   │   │   ├── EmptyState.jsx
│   │   │   └── ThemeToggle.jsx
│   │   ├── customer/                # Customer Portal components
│   │   │   ├── TicketForm.jsx
│   │   │   ├── TicketList.jsx
│   │   │   ├── TicketTimeline.jsx
│   │   │   └── TicketSuccess.jsx
│   │   └── agent/                   # CSKH Dashboard components
│   │       ├── StatCards.jsx
│   │       ├── TicketTable.jsx
│   │       ├── FilterBar.jsx
│   │       ├── AIAnalysisPanel.jsx
│   │       ├── ReplyForm.jsx
│   │       ├── ReplyHistory.jsx
│   │       └── FAQTable.jsx
│   ├── stores/                      # Zustand state management
│   │   ├── useTicketStore.js        # Ticket state (list, filters, pagination)
│   │   ├── useAuthStore.js          # Agent authentication state
│   │   └── useThemeStore.js         # Dark/Light theme state
│   ├── lib/
│   │   ├── api.js                   # API client (fetch wrapper)
│   │   ├── utils.js                 # Helper functions (cn, format date)
│   │   └── constants.js             # App constants (routes, enums)
│   └── styles/
│       └── globals.css              # Tailwind directives + CSS custom properties
└── .env
```

📁 File `.env`:

```env
VITE_API_URL=http://localhost:8080/api/v1
```

✅ **Nghiệm thu:**

- `npm run dev` khởi động server tại `http://localhost:5173`.
- Trang chủ hiển thị đúng layout Landing Page.
- Font Inter được load từ Google Fonts.
- shadcn/ui components (Button, Card) render đúng.

---

### Task 4.2: Xây dựng Design System & Tailwind CSS Config

📁 File `tailwind.config.js`:

- Extend theme với các custom colors (semantic colors: success, warning, danger, info, neutral).
- Cấu hình Dark mode: `darkMode: "class"`.
- Extend font-family: Inter (sans-serif), JetBrains Mono (mono).
- Extend spacing và border-radius theo design system.

📁 File `src/styles/globals.css`:

- Khai báo Tailwind directives: `@tailwind base; @tailwind components; @tailwind utilities;`.
- Khai báo CSS custom properties (`:root` cho Light mode, `.dark` cho Dark mode) cho các color tokens.
- Import Google Fonts: Inter, JetBrains Mono.
- CSS layer `@layer base` cho typography reset và body styles.
- Transition mặc định: `200ms ease`.

📁 Cài đặt **shadcn/ui components** (sử dụng CLI):

```bash
npx shadcn@latest add button input textarea select badge card table dialog sheet skeleton avatar tabs tooltip checkbox label separator sonner dropdown-menu pagination
```

📁 Xây dựng **3 Custom Components** (`src/components/custom/`):

| Component       | Mô tả                          | Props chính                              |
| :-------------- | :----------------------------- | :--------------------------------------- |
| **Sidebar**     | Menu điều hướng dashboard      | `items`, `collapsed`, `onToggle`         |
| **EmptyState**  | Trạng thái khi chưa có dữ liệu | `icon`, `title`, `description`, `action` |
| **ThemeToggle** | Nút chuyển Dark/Light mode     | Sử dụng `useThemeStore` (Zustand)        |

✅ **Nghiệm thu:**

- Tất cả shadcn/ui components render đúng khi import và sử dụng.
- Chuyển đổi Dark/Light mode hoạt động mượt mà (transition `300ms`).
- Các Badge hiển thị đúng màu semantic (URGENT = đỏ, RESOLVED = xanh, v.v.).

---

### Task 4.3: Xây dựng Customer Portal (5 trang)

🔗 Tham chiếu: [FRONTEND_DESIGN.md - Mục 3](./FRONTEND_DESIGN.md)

**Trang 1: Landing Page (`/`)**

- Hero section với gradient text, subtle grid pattern.
- 2 CTA buttons: "Gửi Yêu cầu" (primary) + "Tra cứu Ticket" (secondary).
- Features section: 3 cards minh họa quy trình.

**Trang 2: Submit Ticket (`/submit-ticket`)**

- Form card centered (max-width `640px`).
- 5 fields: Họ tên, Email, Loại dịch vụ (Select), Tiêu đề, Nội dung (Textarea).
- Client-side validation: inline error messages.
- Submit → gọi `POST /api/v1/tickets` → redirect sang trang success.
- Xử lý error 429 (Rate Limit) → Toast error.

**Trang 3: Success Page (`/submit-ticket/success`)**

- Icon checkmark animation.
- Hiển thị `ticket_id` (UUID) + nút Copy to Clipboard.
- Badge trạng thái PENDING.

**Trang 4: Track Tickets (`/track`)**

- Input email + nút tìm kiếm.
- Gọi `GET /api/v1/customer/tickets`.
- Hiển thị danh sách ticket: mã, tiêu đề, service_type, priority badge, status badge.
- Pagination component.
- Empty state khi không có ticket.

**Trang 5: Ticket Detail (`/track/:id`)**

- Card thông tin ticket (title, content, service_type, status).
- Timeline trạng thái dọc: Tạo → AI phân tích → CSKH phản hồi.
- Danh sách replies (ẩn các ghi chú nội bộ `is_internal_note = true`).

📁 API Client (`src/lib/api.js`):

- Fetch wrapper với `import.meta.env.VITE_API_URL` base URL.
- Tự động parse JSON response.
- Error handling: throw custom errors cho 4xx/5xx.

✅ **Nghiệm thu:**

- Toàn bộ 5 trang Customer Portal render đúng layout wireframe.
- Gửi ticket qua form → thành công → hiện trang success với ticket_id.
- Tra cứu bằng email → hiển thị danh sách ticket → click vào → xem chi tiết + replies.
- Rate Limit 429 → Toast error hiển thị.
- Responsive: layout chuyển sang single column trên mobile (< 768px).

---

### Task 4.4: Xây dựng CSKH Dashboard (4 trang)

🔗 Tham chiếu: [FRONTEND_DESIGN.md - Mục 4](./FRONTEND_DESIGN.md)

**Dashboard Shell Layout:**

- Top Bar (56px): Logo, icon thông báo, avatar agent.
- Sidebar (240px, collapsible → 64px): Menu điều hướng (Dashboard, Tickets, FAQs, Đăng xuất).
- Main Content Area: padding `24px`, scroll riêng biệt.

**Trang 1: Agent Login (`/agent/login`)**

- Form đăng nhập: Email + mật khẩu (giản lược v1.0 — xác thực qua `X-User-ID` header).

**Trang 2: Dashboard chính (`/agent/dashboard`)**

- **4 Stat Cards** (hàng ngang): URGENT count (đỏ), PENDING (xanh dương), PROCESSED (vàng), RESOLVED (xanh lá). Click vào → filter danh sách.
- **Filter Bar:** Dropdown Priority, Sentiment, Status, Category + Search input.
- **Ticket Table:** Hiển thị Priority Badge (viền trái màu), Tiêu đề, Tên KH, Sentiment emoji, Thời gian (relative). Row URGENT có background nhẹ. Click → mở chi tiết.
- **Pagination.**
- Gọi API: `GET /api/v1/tickets?priority=...&sentiment=...&page=...&limit=20`.

**Trang 3: Chi tiết Ticket + AI Analysis (`/agent/tickets/:id`)**

- **Layout 2-panel** (60%/40% trên desktop, stacked trên mobile):
  - **Panel trái — Nội dung Ticket:** Avatar + tên + email KH, tiêu đề, nội dung ticket đầy đủ.
  - **Panel phải — AI Analysis:** Sentiment (emoji + badge), Priority (badge), Category (badge), Confidence Score (progress bar), Tóm tắt AI, Câu trả lời gợi ý (suggested_reply trong box nổi bật).
- **Nút "Sao chép":** Copy suggested_reply vào clipboard.
- **Nút "Dùng làm bản nháp":** Paste vào textarea phản hồi bên dưới.
- **Form Gửi Phản hồi:** Textarea (có thể pre-fill từ AI) + Checkbox "Ghi chú nội bộ" + Nút Gửi.
- **Lịch sử Trao đổi:** Danh sách replies dạng chat bubbles, đánh dấu ghi chú nội bộ.
- Gọi API: `GET /api/v1/tickets/:id` + `POST /api/v1/tickets/:id/reply`.

**Trang 4: Quản lý FAQ (`/agent/faqs`)**

- Bảng FAQ: STT, Câu hỏi, Chuyên mục (badge), Hành động (edit/delete).
- Nút "Thêm FAQ" → Modal form.
- Edit → Modal pre-fill. Delete → Modal xác nhận → soft delete (`is_active = false`).
- Gọi API: `GET /api/v1/faqs`.

✅ **Nghiệm thu:**

- Dashboard hiển thị đúng Stat Cards với số liệu thực từ API.
- Filter hoạt động: chọn Priority = URGENT → chỉ hiện ticket URGENT.
- Trang chi tiết: Panel AI Analysis hiển thị đầy đủ sentiment, priority, category, summary, suggested_reply.
- Nút "Dùng làm bản nháp" → textarea được fill nội dung AI.
- Gửi phản hồi → Toast success → ticket status chuyển RESOLVED.
- Responsive: Sidebar collapse trên tablet, ẩn trên mobile.

---

### Task 4.5: Micro-interactions & Polish

**Hiệu ứng cần triển khai:**

| Thành phần         | Hiệu ứng                                                  |
| :----------------- | :-------------------------------------------------------- |
| Page transitions   | Fade-in `opacity 0→1`, duration `200ms`                   |
| Button hover       | `translateY(-1px)` + shadow tăng                          |
| Card hover         | `scale(1.01)` + shadow tăng                               |
| URGENT badge       | Pulse animation nhẹ (CSS keyframes)                       |
| Loading states     | Skeleton loader shimmer trên mọi trang khi đang fetch API |
| Toast notification | Slide-in từ phải, auto-dismiss 4s                         |
| Form submit        | Button chuyển spinner, disabled khi đang gửi              |
| Copy to clipboard  | Tooltip "Đã sao chép!" hiện 2s rồi fade out               |
| Theme toggle       | Smooth transition `300ms` cho tất cả colors               |

✅ **Nghiệm thu:**

- Mọi trang đều có skeleton loading khi fetch dữ liệu.
- Toast notification hoạt động cho cả success và error.
- URGENT badge pulse animation chạy mượt.
- Theme toggle Dark/Light chuyển đổi không bị giật.

---

## Giai đoạn 5: Containerization & CI/CD Pipeline

> **Mục tiêu:** Đóng gói Backend, Worker và Frontend thành Docker images tối ưu với Healthcheck. Thiết lập GitHub Actions tự động lint, test, build và push image.
>
> **Công nghệ tích hợp:** Docker, CI/CD (GitHub Actions)

### Task 5.1: Viết Dockerfile cho Backend API (Node.js)

📁 File `src/backend/Dockerfile`:

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Stage 2: Runtime
FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache wget \
    && addgroup -g 10001 appgroup && adduser -u 10001 -G appgroup -D appuser
COPY --from=builder /app/node_modules ./node_modules
COPY src/ ./src/
COPY package.json ./
USER appuser
EXPOSE 8080
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --spider -q http://localhost:8080/api/v1/health || exit 1
CMD ["node", "src/index.js"]
```

📁 File `src/backend/.dockerignore`:

```
node_modules
.env
__tests__
jest.config.js
```

💻 Build & kiểm tra:

```bash
docker build -t smart-ticketing-backend:local ./src/backend
docker images smart-ticketing-backend:local    # Kiểm tra size
docker run --rm -p 8080:8080 --env-file src/backend/.env --network ticketing-network smart-ticketing-backend:local
```

✅ **Nghiệm thu:**

- Image size $< 200\text{MB}$ (Node.js Alpine).
- Container chạy dưới quyền non-root (`USER 10001`).
- `GET http://localhost:8080/api/v1/health` trả về OK.
- `docker inspect <container>` hiển thị `Health: healthy` sau khi start-period.

---

### Task 5.2: Viết Dockerfile cho AI Worker (Python)

📁 File `src/worker/Dockerfile`:

```dockerfile
FROM python:3.11-slim AS builder
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

FROM python:3.11-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends procps && rm -rf /var/lib/apt/lists/*
RUN useradd -u 10001 -r appuser
COPY --from=builder /install /usr/local
COPY . .
USER appuser
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD pgrep -f worker.py || exit 1
CMD ["python", "worker.py"]
```

> **Ghi chú:** Nếu Worker không expose HTTP port, có thể dùng healthcheck kiểm tra process: `CMD pgrep -f worker.py || exit 1`.

📁 File `src/worker/.dockerignore`:

```
venv
__pycache__
.env
tests
```

💻 Build & kiểm tra:

```bash
docker build -t smart-ticketing-worker:local ./src/worker
docker images smart-ticketing-worker:local     # Kiểm tra size
```

✅ **Nghiệm thu:**

- Image size $< 150\text{MB}$.
- Container chạy dưới quyền non-root.
- `docker inspect <container>` hiển thị Health status.

---

### Task 5.3: Viết Dockerfile cho Frontend (React + Vite)

📁 File `src/frontend/Dockerfile`:

```dockerfile
# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Stage 2: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Stage 3: Runtime (Nginx serve static files)
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --spider -q http://localhost:3000/ || exit 1
CMD ["nginx", "-g", "daemon off;"]
```

📁 Tạo file `src/frontend/nginx.conf` — hỗ trợ SPA routing:

```nginx
server {
    listen 3000;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /assets {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

💻 Build & kiểm tra:

```bash
docker build -t smart-ticketing-frontend:local ./src/frontend
docker images smart-ticketing-frontend:local
```

✅ **Nghiệm thu:**

- Image size $< 50\text{MB}$ (Nginx Alpine + static build).
- Container chạy dưới Nginx, serve static files.
- `http://localhost:3000` hiển thị Landing Page.
- Client-side routing hoạt động (refresh trang không bị 404).
- `docker inspect <container>` hiển thị `Health: healthy`.

---

### Task 5.4: Cập nhật Docker Compose — Full Stack Local (có Healthcheck)

📁 Cập nhật `docker-compose.yml` — thêm 3 service ứng dụng kèm healthcheck:

| Service      | Build context    | Ports               | Depends on                | Healthcheck                          |
| :----------- | :--------------- | :------------------ | :------------------------ | :----------------------------------- |
| **backend**  | `./src/backend`  | `8080:8080`         | postgres, redis, rabbitmq | `GET /api/v1/health` (từ Dockerfile) |
| **worker**   | `./src/worker`   | — (no exposed port) | postgres, redis, rabbitmq | Process check (từ Dockerfile)        |
| **frontend** | `./src/frontend` | `3000:3000`         | backend                   | `GET /` (từ Dockerfile)              |

> **Lưu ý:** Healthcheck đã được định nghĩa trong Dockerfile của mỗi service. Docker Compose sẽ tự động kế thừa. Các service hạ tầng (postgres, redis, rabbitmq) đã có healthcheck từ Giai đoạn 1.

💻 Chạy full stack:

```bash
docker compose up -d --build
docker compose ps                 # Kiểm tra tất cả đều "healthy"
docker compose logs -f backend
docker compose logs -f worker
```

✅ **Nghiệm thu:**

- `docker compose ps` hiển thị 6 containers đều `Up (healthy)` (postgres, redis, rabbitmq, backend, worker, frontend).
- Truy cập `http://localhost:3000` → Landing Page hiển thị.
- Tạo ticket qua Frontend → Backend lưu DB → Worker xử lý AI → Dashboard hiển thị kết quả.
- Toàn bộ luồng end-to-end hoạt động trong Docker.
- Container nào bị unhealthy sẽ tự động restart (nhờ `restart: always`).

---

### Task 5.5: Thiết lập GitHub Actions CI Pipeline (Lint + Test + Build)

📁 File `.github/workflows/ci.yml`:

```yaml
name: Smart Ticketing CI Pipeline

on:
  push:
    branches: ["main"]
  pull_request:
    branches: ["main"]

jobs:
  lint-and-test-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
      - run: cd src/backend && npm ci
      - name: Lint Backend
        run: cd src/backend && npx eslint src/ --max-warnings=0
      - name: Test Backend
        run: cd src/backend && npm test -- --coverage

  lint-and-test-worker:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"
      - run: cd src/worker && pip install -r requirements.txt
      - name: Lint Worker
        run: cd src/worker && python -m flake8 --max-line-length=120 --exclude=venv,__pycache__ .
      - name: Test Worker
        run: cd src/worker && python -m pytest tests/ -v --tb=short

  lint-and-test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
      - run: cd src/frontend && npm ci
      - name: Lint Frontend
        run: cd src/frontend && npx eslint src/ --max-warnings=0
      - name: Build Frontend
        run: cd src/frontend && npm run build

  build-and-push:
    needs: [lint-and-test-backend, lint-and-test-worker, lint-and-test-frontend]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}
      - name: Build & Push Backend
        uses: docker/build-push-action@v5
        with:
          context: ./src/backend
          push: true
          tags: |
            ${{ secrets.DOCKERHUB_USERNAME }}/smart-ticketing-backend:${{ github.sha }}
            ${{ secrets.DOCKERHUB_USERNAME }}/smart-ticketing-backend:latest
      - name: Build & Push Worker
        uses: docker/build-push-action@v5
        with:
          context: ./src/worker
          push: true
          tags: |
            ${{ secrets.DOCKERHUB_USERNAME }}/smart-ticketing-worker:${{ github.sha }}
            ${{ secrets.DOCKERHUB_USERNAME }}/smart-ticketing-worker:latest
      - name: Build & Push Frontend
        uses: docker/build-push-action@v5
        with:
          context: ./src/frontend
          push: true
          tags: |
            ${{ secrets.DOCKERHUB_USERNAME }}/smart-ticketing-frontend:${{ github.sha }}
            ${{ secrets.DOCKERHUB_USERNAME }}/smart-ticketing-frontend:latest
```

**Dev Dependencies cần cài trước (nếu chưa có):**

- Backend: `npm install -D eslint`
- Worker: `pip install flake8` (thêm vào `requirements.txt` hoặc `requirements-dev.txt`)
- Frontend: `npm install -D eslint`

**Secrets cần cấu hình trên GitHub:**

- `DOCKERHUB_USERNAME`
- `DOCKERHUB_TOKEN`

✅ **Nghiệm thu:**

- Push code lên `main` → GitHub Actions tự động chạy 4 jobs.
- Job `lint-and-test-backend`: ESLint PASS + Jest test PASS (có coverage report).
- Job `lint-and-test-worker`: Flake8 PASS + Pytest PASS.
- Job `lint-and-test-frontend`: ESLint PASS + Vite build PASS.
- Job `build-and-push` chỉ chạy khi cả 3 job Lint+Test đều PASS → tạo ra 3 Docker images trên Docker Hub với tag SHA và `latest`.
- Nếu Lint hoặc Test FAIL → pipeline dừng lại, KHÔNG build Docker images.

---

## Giai đoạn 6: Triển khai lên VPS (Docker Compose + Nginx)

> **Mục tiêu:** Deploy toàn bộ hệ thống lên VPS Linux bằng Docker Compose. Cấu hình Nginx Reverse Proxy, SSL miễn phí (Let's Encrypt), bảo mật server, và CD pipeline tự động deploy với health check + rollback.
>
> **Công nghệ tích hợp:** Cloud (VPS), Linux, Docker, CI/CD

### Task 6.1: Chuẩn bị VPS, Cài đặt Docker & Bảo mật Server

**Yêu cầu VPS tối thiểu:**

| Thông số     | Yêu cầu                                                                                                             |
| :----------- | :------------------------------------------------------------------------------------------------------------------ | ------------- |
| **OS**       | Ubuntu 22.04 LTS                                                                                                    |
| **RAM**      | ≥ 4GB                                                                                                               |
| **CPU**      | ≥ 2 vCPU                                                                                                            |
| **Storage**  | ≥ 30GB SSD                                                                                                          |
| **Provider** | Azure for Students (Standard_B2s — miễn phí $100 credit, không cần thẻ tín dụng), DigitalOcean, hoặc bất kỳ VPS nào | 52.253.105.93 |
|  |

💻 **Bước 1 — Kết nối SSH và Bảo mật Server:**

> **Lưu ý với Azure:** Khi tạo máy ảo trên Azure, hệ thống đã tự động tạo cặp khóa SSH và cấp cho bạn file `.pem` (Private Key). Bạn không cần tự tạo bằng `ssh-keygen` hay dùng `ssh-copy-id` nữa.

```bash
# Trên máy local (WSL) — Copy file .pem tải từ Azure vào thư mục .ssh và phân quyền
mkdir -p ~/.ssh
# Thay <TÊN_FILE_KEY>.pem bằng tên file bạn đã tải về
cp /mnt/c/Users/DUC/Downloads/<TÊN_FILE_KEY>.pem ~/.ssh/
chmod 400 ~/.ssh/<TÊN_FILE_KEY>.pem

# SSH vào VPS Azure (User mặc định là azureuser)
ssh -i ~/.ssh/<TÊN_FILE_KEY>.pem azureuser@<VPS_IP>

# (Thực hiện trên VPS) Tắt đăng nhập bằng mật khẩu (chỉ cho phép SSH Key) và root login
# Làm đồ án thì bỏ qua cũng dc
sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo sed -i 's/PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo sed -i 's/#PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
sudo systemctl restart sshd
```

💻 **Bước 2 — Cấu hình UFW Firewall (chỉ mở port cần thiết):**

```bash
# Cài đặt UFW (nếu chưa có)
sudo apt install -y ufw

# Mặc định: chặn tất cả incoming, cho phép outgoing
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Chỉ mở 3 port cần thiết
sudo ufw allow 22/tcp     # SSH
sudo ufw allow 80/tcp     # HTTP (Nginx)
sudo ufw allow 443/tcp    # HTTPS (Nginx)

# Bật firewall
sudo ufw enable
sudo ufw status verbose
```

> ⚠️ **QUAN TRỌNG:** KHÔNG mở port 5432 (PostgreSQL), 6379 (Redis), 5672/15672 (RabbitMQ) ra Internet. Các service này chỉ giao tiếp nội bộ qua Docker network `app-network`.

💻 **Bước 3 — Cài đặt Docker & Docker Compose:**

```bash
# Cài Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# Kiểm tra
docker --version
docker compose version
```

💻 **Bước 4 — Tạo thư mục dự án:**

```bash
mkdir -p ~/smart-ticketing/nginx/certs
cd ~/smart-ticketing
```

✅ **Nghiệm thu:**

- SSH vào VPS bằng SSH Key thành công, đăng nhập bằng mật khẩu bị **từ chối**.
- Root login bị **vô hiệu hóa**.
- `sudo ufw status` hiển thị chỉ 3 port được mở: 22, 80, 443.
- Từ bên ngoài, `telnet <VPS_IP> 5432` (PostgreSQL) bị **refused/timeout** — không thể truy cập.
- `docker --version` và `docker compose version` trả về kết quả hợp lệ.
- Docker chạy được không cần `sudo`.

---

### Task 6.2: Tạo Docker Compose Production & Nginx Reverse Proxy

📁 File `docker-compose.prod.yml` (tại thư mục gốc dự án):

> **Lưu ý bảo mật:** PostgreSQL, Redis, RabbitMQ **KHÔNG expose port ra host**. Chúng chỉ giao tiếp nội bộ qua Docker network `app-network`. Chỉ có Nginx expose port 80/443 ra ngoài.

```yaml
version: "3.8"

services:
  postgres:
    image: postgres:16-alpine
    restart: always
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ticketing_db
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./scripts/init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - app-network
    # ❌ KHÔNG có "ports:" → Không expose ra Internet

  redis:
    image: redis:7-alpine
    restart: always
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - app-network
    # ❌ KHÔNG có "ports:" → Không expose ra Internet

  rabbitmq:
    image: rabbitmq:3.13-management-alpine
    restart: always
    environment:
      RABBITMQ_DEFAULT_USER: ${RABBITMQ_USER}
      RABBITMQ_DEFAULT_PASS: ${RABBITMQ_PASSWORD}
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "-q", "ping"]
      interval: 15s
      timeout: 10s
      retries: 5
    networks:
      - app-network
    # ❌ KHÔNG có "ports:" → Không expose ra Internet (kể cả Management UI 15672)

  backend:
    image: ${DOCKERHUB_USERNAME}/smart-ticketing-backend:${DEPLOY_TAG:-latest}
    restart: always
    env_file:
      - .env
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      rabbitmq:
        condition: service_healthy
    healthcheck:
      test:
        ["CMD", "wget", "--spider", "-q", "http://localhost:8080/api/v1/health"]
      interval: 15s
      timeout: 5s
      retries: 3
    networks:
      - app-network

  worker:
    image: ${DOCKERHUB_USERNAME}/smart-ticketing-worker:${DEPLOY_TAG:-latest}
    restart: always
    env_file:
      - .env
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      rabbitmq:
        condition: service_healthy
    networks:
      - app-network

  frontend:
    image: ${DOCKERHUB_USERNAME}/smart-ticketing-frontend:${DEPLOY_TAG:-latest}
    restart: always
    depends_on:
      - backend
    networks:
      - app-network

  nginx:
    image: nginx:alpine
    restart: always
    ports:
      - "80:80" # ✅ Duy nhất service expose ra Internet
      - "443:443" # ✅ Duy nhất service expose ra Internet
    volumes:
      - ./nginx/default.conf:/etc/nginx/conf.d/default.conf
      - ./nginx/certs:/etc/nginx/certs
      - ./nginx/logs:/var/log/nginx # Lưu access/error logs
    depends_on:
      - frontend
      - backend
    networks:
      - app-network

volumes:
  pgdata:

networks:
  app-network:
    driver: bridge
```

📁 File `nginx/default.conf` — Nginx Reverse Proxy:

```nginx
upstream backend_api {
    server backend:8080;
}

upstream frontend_app {
    server frontend:3000;
}

# Logging format chi tiết (phục vụ monitoring ở Giai đoạn 7)
log_format detailed '$remote_addr - $remote_user [$time_local] '
                     '"$request" $status $body_bytes_sent '
                     '"$http_referer" "$http_user_agent" '
                     'rt=$request_time urt=$upstream_response_time';

server {
    listen 80;
    server_name your-domain.com;   # Thay bằng domain thật hoặc IP VPS

    access_log /var/log/nginx/access.log detailed;
    error_log  /var/log/nginx/error.log warn;

    # Redirect HTTP → HTTPS (bật khi đã có SSL)
    # return 301 https://$host$request_uri;

    # API Backend
    location /api/ {
        proxy_pass http://backend_api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Frontend (React SPA)
    location / {
        proxy_pass http://frontend_app;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}

# HTTPS server (bật khi đã cài Certbot SSL)
# server {
#     listen 443 ssl;
#     server_name your-domain.com;
#
#     ssl_certificate /etc/nginx/certs/fullchain.pem;
#     ssl_certificate_key /etc/nginx/certs/privkey.pem;
#
#     access_log /var/log/nginx/access.log detailed;
#     error_log  /var/log/nginx/error.log warn;
#
#     location /api/ {
#         proxy_pass http://backend_api;
#         proxy_set_header Host $host;
#         proxy_set_header X-Real-IP $remote_addr;
#         proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
#         proxy_set_header X-Forwarded-Proto $scheme;
#     }
#
#     location / {
#         proxy_pass http://frontend_app;
#         proxy_set_header Host $host;
#         proxy_set_header X-Real-IP $remote_addr;
#         proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
#     }
# }
```

📁 File `.env` trên VPS (`~/smart-ticketing/.env`):

# Node Environment

NODE_ENV=production
JWT_SECRET=<strong_jwt_secret_here>
JWT_EXPIRES_IN=1d

# Database

POSTGRES_USER=postgres_admin
POSTGRES_PASSWORD=<strong_password_here>
POSTGRES_HOST=postgres
POSTGRES_DB=ticketing_db
DATABASE_URL=postgresql://postgres_admin:<strong_password_here>@postgres:5432/ticketing_db?schema=public

# RabbitMQ

RABBITMQ_USER=admin
RABBITMQ_PASSWORD=<strong_password_here>
RABBITMQ_HOST=rabbitmq
RABBITMQ_PORT=5672

# Redis

REDIS_HOST=redis
REDIS_PORT=6379

# Backend

PORT=8080

# AI

GEMINI_API_KEY=<your_gemini_api_key>

# Docker Hub

DOCKERHUB_USERNAME=<your_dockerhub_username>

# Deploy Tag (được CD pipeline cập nhật)

DEPLOY_TAG=latest

````

✅ **Nghiệm thu:**

- `docker compose -f docker-compose.prod.yml up -d` chạy thành công trên VPS.
- `docker compose -f docker-compose.prod.yml ps` hiển thị 7 containers đều running (postgres, redis, rabbitmq, backend, worker, frontend, nginx).
- **Bảo mật:** Từ bên ngoài VPS, KHÔNG thể kết nối trực tiếp vào PostgreSQL (5432), Redis (6379), RabbitMQ (5672/15672).
- Truy cập `http://<VPS_IP>` → Landing Page hiển thị.
- Truy cập `http://<VPS_IP>/api/v1/health` → Backend trả về OK.
- Full E2E test: Tạo ticket qua Frontend → Worker xử lý AI → CSKH Dashboard hiển thị kết quả.

---

### Task 6.3: Cài đặt SSL miễn phí với Certbot (Let's Encrypt)

> **Lưu ý:** Task này yêu cầu có domain trỏ về IP VPS. Nếu chưa có domain, có thể bỏ qua và sử dụng HTTP.

💻 Cài đặt Certbot trên VPS:

```bash
sudo apt install -y certbot

# Tạm dừng Nginx container để Certbot bind port 80
docker compose -f docker-compose.prod.yml stop nginx

# Xin chứng chỉ SSL
sudo certbot certonly --standalone -d your-domain.com --email your-email@gmail.com --agree-tos --no-eff-email

# Copy chứng chỉ vào thư mục nginx/certs
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ~/smart-ticketing/nginx/certs/
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ~/smart-ticketing/nginx/certs/
sudo chown -R $USER:$USER ~/smart-ticketing/nginx/certs/
````

📁 Cập nhật `nginx/default.conf` — bỏ comment block HTTPS server và bật redirect HTTP → HTTPS.

💻 Khởi động lại:

```bash
docker compose -f docker-compose.prod.yml up -d nginx
```

💻 Thiết lập tự động gia hạn SSL (cron job):

```bash
sudo crontab -e
# Thêm dòng sau (gia hạn mỗi tháng vào 2h sáng):
0 2 1 * * certbot renew --pre-hook "docker compose -f /home/ubuntu/smart-ticketing/docker-compose.prod.yml stop nginx" --post-hook "docker compose -f /home/ubuntu/smart-ticketing/docker-compose.prod.yml start nginx"
```

✅ **Nghiệm thu:**

- Truy cập `https://your-domain.com` → Landing Page hiển thị với ổ khóa xanh.
- `http://your-domain.com` tự động redirect sang `https://`.
- Chứng chỉ SSL hợp lệ (kiểm tra trên trình duyệt hoặc `curl -vI https://your-domain.com`).

---

### Task 6.4: Thiết lập CD Pipeline — Auto Deploy với Health Check & Rollback

📁 Cập nhật `.github/workflows/ci.yml` — thêm job `deploy` có health check sau deploy và tự động rollback nếu lỗi:

```yaml
deploy-to-vps:
  needs: build-and-push
  if: github.ref == 'refs/heads/main'
  runs-on: ubuntu-latest
  steps:
    - name: Deploy via SSH (with Health Check & Rollback)
      uses: appleboy/ssh-action@v1.0.0
      with:
        host: ${{ secrets.VPS_HOST }}
        username: ${{ secrets.VPS_USERNAME }}
        key: ${{ secrets.VPS_SSH_PRIVATE_KEY }}
        script: |
          set -e
          cd ~/smart-ticketing
          DEPLOY_SHA="${{ github.sha }}"
          COMPOSE="docker compose -f docker-compose.prod.yml"

          echo "📦 [1/5] Lưu image tag hiện tại để rollback nếu cần..."
          CURRENT_TAG=$(grep "^DEPLOY_TAG=" .env | cut -d '=' -f2)
          echo "   Current tag: $CURRENT_TAG"

          echo "📥 [2/5] Pull images mới (tag: $DEPLOY_SHA)..."
          sed -i "s/^DEPLOY_TAG=.*/DEPLOY_TAG=$DEPLOY_SHA/" .env
          $COMPOSE pull backend worker frontend

          echo "🚀 [3/5] Deploy containers mới..."
          $COMPOSE up -d --no-deps backend worker frontend

          echo "🏥 [4/5] Health check sau deploy (chờ tối đa 60s)..."
          HEALTH_OK=false
          for i in $(seq 1 12); do
            sleep 5
            HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/api/v1/health || echo "000")
            echo "   Attempt $i/12: HTTP $HTTP_CODE"
            if [ "$HTTP_CODE" = "200" ]; then
              HEALTH_OK=true
              break
            fi
          done

          if [ "$HEALTH_OK" = "true" ]; then
            echo "✅ [5/5] Deploy thành công! Health check PASSED."
            docker image prune -f
          else
            echo "❌ [5/5] Health check FAILED! Rolling back to tag: $CURRENT_TAG..."
            sed -i "s/^DEPLOY_TAG=.*/DEPLOY_TAG=$CURRENT_TAG/" .env
            $COMPOSE pull backend worker frontend
            $COMPOSE up -d --no-deps backend worker frontend
            echo "🔄 Rollback hoàn tất. Kiểm tra lại health..."
            sleep 10
            curl -sf http://localhost/api/v1/health || echo "⚠️ Rollback health check cũng thất bại!"
            exit 1
          fi
```

📁 Tạo file `scripts/rollback.sh` — Script rollback thủ công trên VPS:

```bash
#!/bin/bash
# Sử dụng: ./scripts/rollback.sh <previous_image_tag>
# Ví dụ:   ./scripts/rollback.sh abc123def

set -e
TAG=${1:?"Usage: $0 <image_tag>"}
cd ~/smart-ticketing

echo "🔄 Rolling back to tag: $TAG..."
sed -i "s/^DEPLOY_TAG=.*/DEPLOY_TAG=$TAG/" .env

docker compose -f docker-compose.prod.yml pull backend worker frontend
docker compose -f docker-compose.prod.yml up -d --no-deps backend worker frontend

echo "🏥 Waiting for health check..."
sleep 15
curl -sf http://localhost/api/v1/health && echo "✅ Rollback thành công!" || echo "❌ Rollback thất bại!"
```

**Secrets bổ sung cần cấu hình trên GitHub:**

- `VPS_HOST` — IP hoặc domain của VPS
- `VPS_USERNAME` — Username SSH (ví dụ: `ubuntu`)
- `VPS_SSH_PRIVATE_KEY` — Private key SSH để kết nối vào VPS

💻 Luồng CD hoàn chỉnh:

```
Push code → GitHub Actions:
  1. lint-and-test-backend     ✅ (ESLint + Jest)
  2. lint-and-test-worker      ✅ (Flake8 + Pytest)
  3. lint-and-test-frontend    ✅ (ESLint + Vite Build)
  4. build-and-push            → Push 3 Docker images lên Docker Hub (tag: SHA + latest)
  5. deploy-to-vps             → SSH vào VPS → Pull images mới → Restart → Health Check
     ├── ✅ Health OK   → Deploy thành công, dọn dẹp images cũ
     └── ❌ Health FAIL → Tự động rollback về phiên bản trước
```

✅ **Nghiệm thu:**

- Push code lên `main` → GitHub Actions tự động chạy 5 jobs.
- Job `deploy-to-vps` SSH vào VPS, pull images mới, restart containers, chạy health check.
- **Kịch bản thành công:** Health check PASS → website cập nhật phiên bản mới.
- **Kịch bản lỗi:** Health check FAIL → tự động rollback về phiên bản trước, pipeline báo lỗi (exit 1).
- Script `rollback.sh` hoạt động khi chạy thủ công: `./scripts/rollback.sh <tag>`.

---

## Giai đoạn 7: (Tùy chọn/Nâng cao) Monitoring, Kiểm thử Chịu tải & Rà soát Tổng thể

> ⚠️ **Lưu ý:** Giai đoạn 7 chứa các kiến thức nâng cao (DevOps, SRE) thường phù hợp với cấp độ Mid/Senior. Với cấp độ Intern/Fresher, bạn đã hoàn thành xuất sắc dự án ở **Giai đoạn 6** và có thể dừng lại ở đây để tập trung chuẩn bị CV và phỏng vấn. Các nội dung dưới đây chỉ mang tính chất tham khảo nếu bạn muốn đào sâu thêm.

> **Mục tiêu:** Thiết lập Monitoring & Logging cơ bản cho server. Thực hiện Load Testing đánh giá hiệu năng chi tiết (RPS, p50, p95, p99, Error Rate). Xác nhận 10/10 công nghệ hoạt động đúng.
>
> **Công nghệ tích hợp:** System Design (Monitoring, Performance Testing, Architecture Patterns)

### Task 7.1: Monitoring & Logging cơ bản

**7.1.1 — Giám sát tài nguyên server (CPU, RAM, Disk):**

📁 Tạo file `scripts/server-monitor.sh` — Script giám sát chạy qua cron:

```bash
#!/bin/bash
# Ghi log tài nguyên server mỗi 5 phút
LOG_FILE="/var/log/smart-ticketing/server-metrics.log"
mkdir -p /var/log/smart-ticketing

TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}')
MEM_TOTAL=$(free -m | awk '/Mem:/ {print $2}')
MEM_USED=$(free -m | awk '/Mem:/ {print $3}')
MEM_PERCENT=$(free | awk '/Mem:/ {printf("%.1f"), $3/$2 * 100}')
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}')

echo "$TIMESTAMP | CPU: ${CPU_USAGE}% | RAM: ${MEM_USED}MB/${MEM_TOTAL}MB (${MEM_PERCENT}%) | Disk: ${DISK_USAGE}" >> "$LOG_FILE"

# Cảnh báo nếu tài nguyên vượt ngưỡng
if (( $(echo "$MEM_PERCENT > 90" | bc -l) )); then
  echo "$TIMESTAMP | ⚠️ WARNING: RAM usage > 90%!" >> "$LOG_FILE"
fi
```

💻 Thiết lập cron (chạy mỗi 5 phút):

```bash
chmod +x ~/smart-ticketing/scripts/server-monitor.sh
sudo crontab -e
# Thêm dòng:
*/5 * * * * /home/ubuntu/smart-ticketing/scripts/server-monitor.sh
```

**7.1.2 — Giám sát Docker Containers:**

💻 Các lệnh kiểm tra thường xuyên:

```bash
# Xem trạng thái & health tất cả containers
docker compose -f docker-compose.prod.yml ps

# Xem tài nguyên (CPU/RAM) realtime từng container
docker stats --no-stream

# Xem logs ứng dụng (Application logs)
docker compose -f docker-compose.prod.yml logs -f --tail=100 backend
docker compose -f docker-compose.prod.yml logs -f --tail=100 worker

# Xem logs container bị restart
docker compose -f docker-compose.prod.yml logs --since="1h" backend
```

📁 Tạo file `scripts/container-health.sh` — Kiểm tra health nhanh:

```bash
#!/bin/bash
# Kiểm tra health status tất cả containers
echo "=== Container Health Check: $(date) ==="
COMPOSE="docker compose -f /home/ubuntu/smart-ticketing/docker-compose.prod.yml"

$COMPOSE ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "=== Resource Usage ==="
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"

echo ""
echo "=== API Health ==="
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/api/v1/health)
echo "Backend Health: HTTP $HTTP_CODE"
```

**7.1.3 — Nginx Access & Error Logs:**

Logs đã được mount volume trong `docker-compose.prod.yml` (`./nginx/logs:/var/log/nginx`).

💻 Xem Nginx logs:

```bash
# Access log (ai truy cập, response time)
tail -f ~/smart-ticketing/nginx/logs/access.log

# Error log (lỗi proxy, upstream timeout)
tail -f ~/smart-ticketing/nginx/logs/error.log

# Thống kê request per second (RPS) nhanh
awk '{print $4}' ~/smart-ticketing/nginx/logs/access.log | cut -d: -f1-3 | sort | uniq -c | tail -20

# Thống kê HTTP status codes
awk '{print $9}' ~/smart-ticketing/nginx/logs/access.log | sort | uniq -c | sort -rn | head -10

# Tìm request chậm (response time > 1s)
awk -F'rt=' '$2+0 > 1.0' ~/smart-ticketing/nginx/logs/access.log
```

💻 Thiết lập log rotation (tránh đầy ổ đĩa):

```bash
sudo tee /etc/logrotate.d/smart-ticketing << 'EOF'
/home/ubuntu/smart-ticketing/nginx/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    sharedscripts
    postrotate
        docker compose -f /home/ubuntu/smart-ticketing/docker-compose.prod.yml exec -T nginx nginx -s reload 2>/dev/null || true
    endscript
}

/var/log/smart-ticketing/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
}
EOF
```

✅ **Nghiệm thu:**

- `cat /var/log/smart-ticketing/server-metrics.log` hiển thị dữ liệu CPU, RAM, Disk theo thời gian.
- `docker stats --no-stream` hiển thị CPU/RAM usage từng container.
- Nginx access log ghi nhận request kèm `rt=` (response time) và `urt=` (upstream response time).
- Log rotation hoạt động: file log cũ được nén (`.gz`) sau 1 ngày, giữ tối đa 14 ngày.
- Script `container-health.sh` chạy cho kết quả tổng hợp rõ ràng.

---

### Task 7.2: Kiểm thử Chịu tải (Load Testing) — Đo chi tiết RPS, p50, p95, p99

💻 Cài đặt k6:

```bash
# Trên Ubuntu/WSL
sudo apt install k6
# Hoặc dùng Docker
docker run --rm -i grafana/k6 run - < loadtest.js
```

📁 File `scripts/loadtest.js`:

```javascript
import http from "k6/http";
import { check, sleep } from "k6";
import { Trend, Rate, Counter } from "k6/metrics";

// Custom metrics
const ticketCreated = new Counter("tickets_created");
const ticketRateLimited = new Counter("tickets_rate_limited");
const responseTime = new Trend("custom_response_time", true);

export const options = {
  stages: [
    { duration: "30s", target: 50 }, // Warm-up: ramp to 50 VUs
    { duration: "1m", target: 200 }, // Sustain: hold 200 VUs
    { duration: "30s", target: 500 }, // Spike: push to 500 VUs
    { duration: "30s", target: 0 }, // Cool-down: ramp to 0
  ],
  thresholds: {
    // Tiêu chí PASS/FAIL
    http_req_duration: [
      "p(50)<100", // p50 < 100ms
      "p(95)<200", // p95 < 200ms
      "p(99)<500", // p99 < 500ms
    ],
    http_req_failed: ["rate<0.01"], // Error rate < 1% (không tính 429)
    http_reqs: ["rate>0"], // Đảm bảo có requests
  },
};

export default function () {
  const payload = JSON.stringify({
    title: `Test Ticket ${Date.now()}`,
    content: "Tôi cần hỗ trợ xử lý đơn hàng.",
    service_type: "PAYMENT",
  });
  const headers = {
    "Content-Type": "application/json",
    "X-User-ID": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  };

  const res = http.post("http://<VPS_IP>/api/v1/tickets", payload, {
    headers,
    tags: { name: "POST_ticket" },
  });

  // Track custom metrics
  responseTime.add(res.timings.duration);

  check(res, {
    "status is 201 (created)": (r) => {
      if (r.status === 201) {
        ticketCreated.add(1);
        return true;
      }
      return false;
    },
    "status is 429 (rate limited)": (r) => {
      if (r.status === 429) {
        ticketRateLimited.add(1);
        return true;
      }
      return false;
    },
    "status is 201 or 429": (r) => r.status === 201 || r.status === 429,
  });

  sleep(0.1);
}

export function handleSummary(data) {
  const duration = data.metrics.http_req_duration;
  const reqs = data.metrics.http_reqs;
  console.log("\n========== 📊 KẾT QUẢ LOAD TEST ==========");
  console.log(`Total Requests : ${reqs.values.count}`);
  console.log(`RPS (avg)      : ${reqs.values.rate.toFixed(2)} req/s`);
  console.log(`Response Time  :`);
  console.log(`  p50          : ${duration.values["p(50)"].toFixed(2)} ms`);
  console.log(`  p95          : ${duration.values["p(95)"].toFixed(2)} ms`);
  console.log(`  p99          : ${duration.values["p(99)"].toFixed(2)} ms`);
  console.log(`  max          : ${duration.values.max.toFixed(2)} ms`);
  console.log(
    `Error Rate     : ${(data.metrics.http_req_failed.values.rate * 100).toFixed(2)}%`,
  );
  console.log("============================================\n");

  return {
    stdout: textSummary(data, { indent: " ", enableColors: true }),
    "scripts/loadtest-result.json": JSON.stringify(data, null, 2),
  };
}

import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";
```

💻 Chạy Load Test:

```bash
cd ~/smart-ticketing
k6 run scripts/loadtest.js
```

**Kết quả mong đợi (bảng mẫu):**

| Metric              | Mục tiêu         | Mô tả                                              |
| :------------------ | :--------------- | :------------------------------------------------- |
| **RPS (avg)**       | Ghi nhận         | Số request mỗi giây trung bình (càng cao càng tốt) |
| **p50**             | $< 100\text{ms}$ | 50% requests nhanh hơn giá trị này                 |
| **p95**             | $< 200\text{ms}$ | 95% requests nhanh hơn giá trị này                 |
| **p99**             | $< 500\text{ms}$ | 99% requests nhanh hơn giá trị này                 |
| **Error Rate**      | $< 1\%$          | Tỷ lệ lỗi (không tính 429 Rate Limit)              |
| **Tickets Created** | Ghi nhận         | Tổng số ticket tạo thành công                      |
| **Rate Limited**    | Ghi nhận         | Tổng số request bị Rate Limit (429) — hành vi đúng |

✅ **Nghiệm thu:**

- k6 chạy hoàn tất 4 giai đoạn (warm-up → sustain → spike → cool-down).
- p50 $< 100\text{ms}$, p95 $< 200\text{ms}$, p99 $< 500\text{ms}$.
- Error rate $< 1\%$ (không tính 429 Rate Limit — đó là hành vi đúng thiết kế).
- RPS, tổng số tickets tạo thành công, số lượng rate-limited requests được ghi nhận rõ ràng.
- File `scripts/loadtest-result.json` được tạo ra chứa kết quả chi tiết.
- Server VPS không bị crash hoặc OOM (Out of Memory) trong quá trình test.
- Kiểm tra `docker stats --no-stream` và `server-monitor.sh` trong lúc chạy load test để theo dõi tài nguyên.

---

### Task 7.3: Kiểm tra Tổng thể — Rà soát 10/10 Công nghệ

| #   | Công nghệ          | Kiểm tra                                                                                                      | Trạng thái |
| :-- | :----------------- | :------------------------------------------------------------------------------------------------------------ | :--------- |
| 1   | **Backend**        | Express API server running, 6 endpoints hoạt động                                                             | [ ]        |
| 2   | **Database**       | PostgreSQL 5 bảng, CRUD hoạt động, Indexes tối ưu                                                             | [ ]        |
| 3   | **Redis**          | Rate Limiting chặn đúng 5 req/phút, Cache FAQ & Priority List                                                 | [ ]        |
| 4   | **Message Queue**  | RabbitMQ: Exchange + Queue + DLQ, message pub/sub hoạt động                                                   | [ ]        |
| 5   | **AI Integration** | Gemini 1.5 Flash phân tích ticket → JSON kết quả chính xác                                                    | [ ]        |
| 6   | **Docker**         | 3 Dockerfiles Multi-stage + Healthcheck, image size tối ưu, non-root user                                     | [ ]        |
| 7   | **Linux**          | Dev trên WSL2/Ubuntu, Production trên VPS Linux, UFW Firewall, SSH Key Only                                   | [ ]        |
| 8   | **Cloud**          | Ứng dụng chạy trên VPS (Oracle Cloud Free Tier hoặc tương đương)                                              | [ ]        |
| 9   | **CI/CD**          | GitHub Actions: Lint → Test → Build → Push → Deploy (Health Check + Rollback) qua SSH                         | [ ]        |
| 10  | **System Design**  | Microservices, Event-Driven (RabbitMQ), Cache-Aside, Retry + DLQ, Reverse Proxy (Nginx), Monitoring & Logging | [ ]        |

✅ **Nghiệm thu cuối cùng:** Tất cả 10 ô `[ ]` trong bảng trên được đánh dấu `[x]`.

---

## 📊 Tổng hợp Ước lượng Thời gian

| Giai đoạn   | Mô tả                                           | Tasks              | Ước lượng       |
| :---------- | :---------------------------------------------- | :----------------- | :-------------- |
| **Phase 1** | Setup, Docker Compose, DB Schema                | 3 tasks            | 1 ngày          |
| **Phase 2** | Backend API, Redis, Tests                       | 6 tasks            | 3-4 ngày        |
| **Phase 3** | RabbitMQ, AI Worker, Gemini API                 | 4 tasks            | 3-4 ngày        |
| **Phase 4** | **Frontend (Customer Portal + CSKH Dashboard)** | **5 tasks**        | **4-5 ngày**    |
| **Phase 5** | Dockerfiles (Healthcheck), Lint + Test CI       | 5 tasks            | 1-2 ngày        |
| **Phase 6** | VPS Security, Nginx, SSL, CD (Rollback)         | 4 tasks            | 2-3 ngày        |
| **Phase 7** | Monitoring, Load Test (RPS/p50/p95/p99), Check  | 3 tasks            | 1-2 ngày        |
|             |                                                 | **Tổng: 30 tasks** | **~14-20 ngày** |
