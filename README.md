# 🌟 AI-Powered Smart Ticketing & CSKH System

[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=nodedotjs)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-Vite-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Python](https://img.shields.io/badge/Python-Worker-3776AB?style=for-the-badge&logo=python)](https://python.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Prisma-4169E1?style=for-the-badge&logo=postgresql)](https://postgresql.org/)
[![RabbitMQ](https://img.shields.io/badge/RabbitMQ-AMQP-FF6600?style=for-the-badge&logo=rabbitmq)](https://www.rabbitmq.com/)
[![Redis](https://img.shields.io/badge/Redis-Caching-DC382D?style=for-the-badge&logo=redis)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker)](https://www.docker.com/)

Hệ thống Xử lý Hỗ trợ Khách hàng (CSKH) Tự động hóa bằng AI theo kiến trúc **Microservices & Event-Driven**. Dự án nhằm tối ưu hóa quy trình tiếp nhận, phân loại và phản hồi yêu cầu hỗ trợ (tickets) tự động bằng cách tích hợp mô hình ngôn ngữ lớn (LLM - Gemini 1.5 Flash).

---

## 🚀 Tính năng nổi bật (Key Features)

### 🤖 Phân tích AI Tự động (Smart AI Analysis)
- Tự động phân tích sắc thái cảm xúc (Sentiment) của khách hàng (POSITIVE, NEUTRAL, ANGRY).
- Tự động phân loại danh mục (Category) và gán mức độ ưu tiên (Priority) dựa trên mức độ nghiêm trọng.
- AI tự động tóm tắt nội dung Ticket và soạn sẵn bản nháp câu trả lời (Suggested Reply) cho nhân viên CSKH.

### ⚡ Xử lý Bất đồng bộ (Event-Driven Architecture)
- Tích hợp **RabbitMQ** làm Message Queue. Client khi tạo Ticket sẽ nhận được response ngay lập tức (< 100ms) mà không phải chờ AI xử lý.
- AI Worker (Python) hoạt động độc lập ngầm (Background Job), nhận tin nhắn từ RabbitMQ và đẩy kết quả phân tích về Database.

### 🛡️ Bảo mật & Hiệu năng
- Tích hợp **Redis** để giới hạn số lần gọi API (Rate Limiting) nhằm chống spam (DDoS/Brute Force).
- Xác thực bằng **JWT (JSON Web Token)** với phân quyền (Role-based Access Control) phân tách rõ ràng giữa CUSTOMER, AGENT, và ADMIN.

### 💻 Giao diện Portal Trực quan
- Frontend xây dựng bằng **React & Vite** với thiết kế hiện đại, mượt mà.
- **Dashboard CSKH** hiển thị danh sách ticket theo mức độ ưu tiên ưu tiên xử lý các vé `URGENT` và khách hàng `ANGRY` lên đầu.

---

## 🛠️ Công nghệ sử dụng (Tech Stack)

| Thành phần | Công nghệ | Chi tiết |
| :--- | :--- | :--- |
| **Frontend** | React, Vite, Tailwind CSS | Xây dựng Single Page App (SPA) với UI mượt mà |
| **Backend API** | Node.js, Express, Prisma ORM | Xử lý Core Business Logic, Authentication, API |
| **AI Worker** | Python, Google GenAI SDK | Chuyên xử lý tác vụ nặng giao tiếp với LLM |
| **Database** | PostgreSQL | Lưu trữ dữ liệu quan hệ chặt chẽ (Users, Tickets) |
| **Message Queue**| RabbitMQ | Điều phối luồng xử lý bất đồng bộ giữa Node và Python |
| **Caching** | Redis | Rate Limiting, tối ưu hóa truy xuất dữ liệu |
| **DevOps** | Docker, Docker Compose, Nginx | Container hóa 7 services, Reverse Proxy cho Production |

---

## 📂 Cấu trúc thư mục dự án (Directory Structure)

```text
smart-ticketing-system/
├── docs/                    # Tài liệu thiết kế hệ thống chi tiết
├── src/
│   ├── backend/             # Node.js Express API Service
│   ├── worker/              # Python AI Worker Service (Gemini Integration)
│   └── frontend/            # React/Vite Web App Client & Dashboard
├── scripts/                 # Scripts tiện ích (Khởi tạo DB, Seed dữ liệu)
├── docker-compose.yml       # Cấu hình hạ tầng Dev Local (Postgres, Redis, RabbitMQ)
├── docker-compose.prod.yml  # Cấu hình hạ tầng Production (7 services + Nginx)
└── README.md
```

---

## 💻 Hướng dẫn chạy dự án cục bộ (Local Development)

### 1. Khởi động hạ tầng phụ trợ
Dự án sử dụng Docker để giả lập hạ tầng gồm PostgreSQL, Redis, và RabbitMQ.
```bash
# Tại thư mục gốc của dự án
docker compose up -d
```

### 2. Cấu hình Backend (Node.js)
```bash
cd src/backend
npm install
# Copy .env.example thành .env và cấu hình DB URL
npx prisma db push # Đẩy schema vào Database
npm run dev
```

### 3. Cấu hình AI Worker (Python)
```bash
cd src/worker
python -m venv venv
source venv/bin/activate # Hoặc .\venv\Scripts\Activate.ps1 trên Windows
pip install -r requirements.txt
# Copy .env.example thành .env và điền GEMINI_API_KEY
python worker.py
```

### 4. Cấu hình Frontend (React)
```bash
cd src/frontend
npm install
npm run dev
```

---

## 🌍 Triển khai lên Production (Azure VPS)
Dự án được container hóa toàn bộ bằng Docker và triển khai thực tế trên môi trường **Azure VPS (Ubuntu 22.04 LTS)**.
Tất cả 7 services (Nginx Reverse Proxy, Frontend, Backend, Worker, Database PostgreSQL, RabbitMQ Message Queue, Redis Cache) đều hoạt động độc lập và bảo mật với SSL/HTTPS.

Bạn có thể xem file `docker-compose.prod.yml` và tham khảo tài liệu [DEPLOYMENT_PLAN.md](./docs/DEPLOYMENT_PLAN.md) hoặc [PLAN.md - Task 6.1](./docs/PLAN.md) để biết thêm chi tiết.

---

## 📖 Hệ thống Tài liệu Thiết kế
Các tài liệu thiết kế chi tiết (Software Development Lifecycle) nằm tại thư mục [docs/](./docs/):
- **Yêu cầu dự án:** [REQUIREMENTS.md](./docs/REQUIREMENTS.md)
- **Kiến trúc hệ thống:** [ARCHITECTURE.md](./docs/ARCHITECTURE.md)
- **Thiết kế cơ sở dữ liệu:** [DATABASE_DESIGN.md](./docs/DATABASE_DESIGN.md)
- **Đặc tả API:** [API_SPECIFICATION.md](./docs/API_SPECIFICATION.md)
- **Kế hoạch triển khai:** [PLAN.md](./docs/PLAN.md)
