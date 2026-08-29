# SYSTEM REQUIREMENTS SPECIFICATION (SRS)

**Dự án:** AI-Powered Smart Ticketing & CSKH System  
**Phiên bản:** 1.0  
**Trạng thái:** Draft / Baseline

---

## 1. Giới thiệu & Mục tiêu Dự án (Overview & Objectives)

### 1.1. Bài toán Thực tế (Business Problem)

Các trung tâm Hỗ trợ Khách hàng (CSKH) và bộ phận Helpdesk IT/E-commerce thường bị quá tải do số lượng yêu cầu (tickets) gửi về dồn dập. Xử lý thủ công dẫn đến các vấn đề:

- **Trễ hạn phản hồi:** Các ticket mang tính cấp bách (Lỗi thanh toán, khiếu nại gay gắt) bị chậm trả lời
- **Lãng phí nhân lực:** Phân loại, gán nhãn thủ công và trả lời các câu hỏi lặp đi lặp lại (FAQ)
- **Tắc nghẽn hệ thống:** Dễ bị quá tải khi lưu lượng truy cập tăng đột biến (Flash Sale, Sự cố dịch vụ)

### 1.2. Giải pháp (Solution)

Xây dựng Hệ thống Xử lý Hỗ trợ Khách hàng Tự động hóa bằng AI theo kiến trúc **Microservices & Event-Driven:**

- **Tiếp nhận bất đồng bộ:** Asynchronous API để đảm bảo tốc độ phản hồi cực nhanh cho phía client ($< 100\text{ms}$)
- **AI Analysis:** Sử dụng Gemini API để phân tích cảm xúc, tự động gán nhãn, độ ưu tiên, tóm tắt và soạn câu trả lời gợi ý
- **Dashboard CSKH:** Quản lý các ticket đã được phân loại ưu tiên
- **Triển khai Cloud-Native:** Docker, Kubernetes, CI/CD trên Linux/Cloud với tiêu chí tối ưu chi phí 0đ (Free-tier)

---

## 2. Bản đồ 11 Công nghệ Cốt lõi (11-Pillar Tech Alignment)

| STT | Công nghệ | Ứng dụng cụ thể trong Hệ thống |
|-----|-----------|-------------------------------|
| 1 | Backend | Viết RESTful API Service (Golang / Python FastAPI / Node.js) tiếp nhận ticket, auth, quản lý data |
| 2 | Database | PostgreSQL: Lưu trữ quan hệ giữa Users, Tickets, AI Analyses, Replies, FAQs |
| 3 | Redis | Caching danh sách Ticket HOT/FAQ, Rate Limiting chống spam API, lưu Session |
| 4 | Message Queue | RabbitMQ / Kafka: Hàng đợi bất đồng bộ chuyển giao công việc cho AI Worker, chống nghẽn DB |
| 5 | AI Integration | Gemini 1.5 Flash API (Free): Bộ não phân tích Sentiment, Categorization, Summary & Auto-Draft Reply |
| 6 | Docker | Containerize Backend API, Worker Service, Database, Redis, RabbitMQ |
| 7 | Linux | Môi trường hệ điều hành chuẩn (WSL2 Ubuntu local hoặc Oracle Cloud Linux VPS) |
| 8 | Cloud | Oracle Cloud Always Free / AWS Free Tier đăng ký hosting hạ tầng |
| 9 | CI/CD | GitHub Actions tự động Lint, Test, Build Docker Image, Push Docker Hub và Deploy |
| 10 | Kubernetes | K3s / k3d cluster quản lý Pods, Ingress Routing, ConfigMaps, Secrets và Auto-scaling |
| 11 | System Design | Microservices Architecture, Event-Driven, Publisher-Subscriber, Caching Strategy, Retry Pattern |

---

## 3. Yêu cầu Chức năng (Functional Requirements - FR)

### 3.1. Phân hệ Khách hàng (Customer Portal / Web Client)

- **FR-1.1 (Tạo Ticket):** Khách hàng điền thông tin (Họ tên, Email, Loại dịch vụ, Nội dung yêu cầu)
- **FR-1.2 (Xác nhận Tức thì):** Hệ thống trả về Mã Ticket (ticket_id) ngay lập tức ($< 100\text{ms}$) kèm trạng thái PENDING
- **FR-1.3 (Tra cứu Trạng thái):** Khách hàng có thể tra cứu lịch sử xử lý ticket bằng ticket_id hoặc Email

### 3.2. Phân hệ Xử lý Bất đồng bộ & AI Worker (Async AI Processing)

- **FR-2.1 (Queue Ingestion):** Ngay sau khi lưu ticket thô, Backend phát ra Event TICKET_CREATED đẩy vào Message Queue (RabbitMQ)

- **FR-2.2 (AI Analysis Worker):** Worker ngắt message từ Queue, gọi Gemini API phân tích nội dung ticket:
  - Sentiment Analysis: Xác định cảm xúc (POSITIVE, NEUTRAL, ANGRY)
  - Priority Classification: Đánh độ ưu tiên (LOW, MEDIUM, HIGH, URGENT)
  - Categorization: Dán nhãn tự động (REFUND, TECHNICAL_BUG, SHIPPING, FAQ)
  - Summarization: Tóm tắt ngắn gọn nội dung ticket trong 1 câu
  - Draft Reply Generation: Sinh câu trả lời mẫu theo kịch bản CSKH

- **FR-2.3 (Persistence):** Cập nhật kết quả phân tích vào PostgreSQL và đổi trạng thái ticket thành PROCESSED

### 3.3. Phân hệ CSKH / Admin Dashboard

- **FR-3.1 (Priority Queue View):** Hiển thị danh sách ticket tự động sắp xếp theo thứ tự ưu tiên (Tô màu cảnh báo ticket URGENT và ANGRY lên top)
- **FR-3.2 (AI Assistant Review):** CSKH xem nội dung ticket kèm theo tóm tắt AI và câu trả lời gợi ý (Suggested Reply)
- **FR-3.3 (One-Click Reply):** CSKH có thể chỉnh sửa nhẹ hoặc bấm 1-click gửi ngay câu trả lời cho khách hàng
- **FR-3.4 (FAQ Auto-Resolution):** Nếu AI nhận diện đây là câu hỏi thường gặp (FAQ) có độ tin cậy $> 95\%$, hệ thống tự động trả lời và đóng ticket (Option cấu hình)

---

## 4. Yêu cầu Phi chức năng (Non-Functional Requirements - NFR)

### 4.1. Hiệu năng (Performance)

- Thời gian phản hồi API tiếp nhận ticket: $t < 100\text{ms}$
- Thời gian AI Worker xử lý ngầm và cập nhật kết quả: $t < 5\text{s}$ (phụ thuộc vào Gemini API latency)
- Hệ thống chịu tải tối thiểu 1,000 requests/giây ở luồng ngắt API tiếp nhận mà không sập Database

### 4.2. Khả năng Mở rộng (Scalability & Auto-scaling)

- Worker Service phải có khả năng scale ngang (Horizontal Scaling)
- Áp dụng HPA / KEDA trong Kubernetes để tự động tăng số lượng Pod Worker dựa trên số lượng Message dồn ứ trong RabbitMQ Queue (Queue Depth $> 50$)

### 4.3. Tiết kiệm Chi phí (Cost Efficiency)

Sử dụng 100% Free Tier:
- **AI:** Gemini 1.5 Flash API (Rate limit 60 RPM free)
- **Cloud:** Oracle Cloud Always Free (ARM 4 vCPU, 24GB RAM)
- **CI/CD:** GitHub Actions Free minutes
- **Domain/SSL:** Cloudflare Free SSL + Free DNS

### 4.4. Tính Tin cậy & Khôi phục (Reliability & Fault Tolerance)

- **Retry Mechanism:** Khi Gemini API bị lỗi/rate-limit, AI Worker tự động retry có khoảng hoãn (Exponential Backoff)
- **Dead Letter Queue (DLQ):** Nếu message xử lý thất bại quá 3 lần, đẩy vào DLQ để kỹ sư kiểm tra thủ công
- **Circuit Breaker:** Chống sập dây chuyền khi AI API quá tải

### 4.5. Bảo mật & Giới hạn (Security & Rate Limiting)

- **Rate Limiting:** Sử dụng Redis để giới hạn mỗi IP/Email chỉ được gửi tối đa 5 tickets/phút
- **Secrets Management:** Không hardcode API Key, DB Password vào codebase. Toàn bộ lưu trữ dưới dạng K8s Secrets / Environment Variables

---

## 5. Phạm vi Dự án (Project Scope)

### 5.1. Trong Phạm vi (In-Scope - v1.0)

- Hoàn thiện 11 công nghệ trong toàn bộ kiến trúc
- RESTful API Backend + Async Worker Service
- PostgreSQL + Redis + RabbitMQ containerized
- Gemini API Integration cho Sentiment, Categorization & Draft Reply
- Docker & Kubernetes (K3s/k3d) deployment manifests
- CI/CD pipeline bằng GitHub Actions
- Giao diện Web Client gửi Ticket & Dashboard CSKH đơn giản

### 5.2. Ngoài Phạm vi (Out-of-Scope - Các phiên bản tương lai)

- Tích hợp Omnichannel (Chưa làm phần chat trực tiếp Facebook/Zalo/Telegram)
- Thanh toán trực tiếp trên hệ thống
- Fine-tune model AI riêng (Chỉ dùng Prompt Engineering & RAG nhẹ nếu cần)