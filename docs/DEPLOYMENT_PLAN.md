# SYSTEM DEPLOYMENT & DEVOPS SPECIFICATION

* **Dự án:** AI-Powered Smart Ticketing & CSKH System
* **Phiên bản:** 1.0
* **Trạng thái:** Draft / Architecture Baseline

---

## 1. Tổng quan Chiến lược Triển khai (Deployment Strategy)

Hệ thống được thiết kế theo tiêu chí **100% Free Tier & Cloud-Native Ready**:
* **Local Development Environment:** Linux WSL2 (Ubuntu 22.04 LTS), Docker Desktop, k3d (Kubernetes in Docker).
* **Production Cloud Environment:** Oracle Cloud Always Free Tier (1 Instance Ampere ARM 4 vCPU, 24GB RAM, 200GB Storage) chạy K3s Lightweight Kubernetes.
* **Automation:** CI/CD Pipeline bằng GitHub Actions tự động hoá từ khâu Testing, Build Container đến Deploy zero-downtime.

---

## 2. Chiến lược Đóng gói Container (Docker Strategy)

Tất cả dịch vụ ứng dụng đều được đóng gói thành các Docker Image tối ưu hóa dung lượng thông qua kĩ thuật **Multi-stage Builds**.

### 2.1. Đóng gói Backend API Service (`src/backend/Dockerfile`)
* **Stage 1 (Build):** Dùng `golang:1.22-alpine` hoặc `python:3.11-slim` để compile binary / cài đặt dependencies.
* **Stage 2 (Runtime):** Dùng `alpine:3.19` hoặc `gcr.io/distroless/static-debian12` chỉ chứa binary đã compile.
* **Chỉ tiêu kích thước:** Image size $< 50\text{MB}$ (đối với Go) hoặc $< 150\text{MB}$ (đối với Python).

### 2.2. Đóng gói AI Worker Service (`src/worker/Dockerfile`)
* **Base Image:** `python:3.11-slim`
* **Dependencies:** `pika` (RabbitMQ), `google-generativeai`, `psycopg2-binary`, `redis`.
* **Security:** Chạy container dưới dạng Non-root User (`USER 10001`).

### 2.3. Quy ước Đặt tên Tag trên Docker Hub
```
{dockerhub_username}/smart-ticketing-backend:{git_commit_sha}
{dockerhub_username}/smart-ticketing-backend:latest

{dockerhub_username}/smart-ticketing-worker:{git_commit_sha}
{dockerhub_username}/smart-ticketing-worker:latest
```

---

## 3. Quy hoạch Hạ tầng Kubernetes (K8s Manifests Architecture)

Toàn bộ tài nguyên Kubernetes nằm trong thư mục `/k8s` và quản lý dưới dạng Declarative YAMLs.

```
k8s/
├── 00-namespace.yaml             # Khai báo Namespace: `smart-ticketing`
├── 01-configmap.yaml             # Lưu các thông số môi trường không bảo mật
├── 02-secrets.yaml               # Lưu Gemini API Key, DB Passwords (base64)
├── 03-postgres-deployment.yaml  # PostgreSQL Stateful/Deployment + PVC (10GB)
├── 04-redis-deployment.yaml      # Redis Cache Deployment + ClusterIP
├── 05-rabbitmq-deployment.yaml   # RabbitMQ Broker Deployment + Management UI
├── 06-backend-deployment.yaml    # Backend REST API Deployment + ClusterIP
├── 07-worker-deployment.yaml      # AI Worker Deployment
├── 08-ingress.yaml               # Ingress Nginx / Traefik Routing
└── 09-autoscaling.yaml           # HPA / KEDA Autoscaler configuration
```

### 3.1. Cấu hình Health Checks & Resources
Tất cả các Pods ứng dụng bắt buộc khai báo `livenessProbe`, `readinessProbe` và `resources`.

*Ví dụ Cấu hình Backend Deployment Probe & Limits:*
```yaml
spec:
  containers:
    - name: backend-api
      image: myrepo/smart-ticketing-backend:latest
      ports:
        - containerPort: 8080
      resources:
        requests:
          memory: "128Mi"
          cpu: "100m"
        limits:
          memory: "512Mi"
          cpu: "500m"
      readinessProbe:
        httpGet:
          path: /api/v1/health
          port: 8080
        initialDelaySeconds: 5
        periodSeconds: 10
      livenessProbe:
        httpGet:
          path: /api/v1/health
          port: 8080
        initialDelaySeconds: 15
        periodSeconds: 20
```

### 3.2. Cấu hình KEDA / HPA Auto-Scaling (`09-autoscaling.yaml`)
Tự động scale `ai-worker` dựa trên độ dài hàng chờ của RabbitMQ Queue:

```yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: ai-worker-autoscaler
  namespace: smart-ticketing
spec:
  scaleTargetRef:
    name: ai-worker-deployment
  minReplicaCount: 1
  maxReplicaCount: 5
  triggers:
    - type: rabbitmq
      metadata:
        queueName: "ticket.process.queue"
        mode: QueueLength
        value: "20" # Khi Queue có trên 20 tin nhắn dồn ứ -> Scale thêm Pod
```

---

## 4. Quy trình CI/CD Pipeline (GitHub Actions Workflow)

Pipeline tự động hóa qua file `.github/workflows/ci-cd.yml` mỗi khi có sự kiện git push vào branch `main`.

```
┌─────────────────────────────────┐
│   Git Push to `main` Branch     │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│  Stage 1: Lint & Unit Tests     │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│  Stage 2: Build & Push Docker   │
│  Tag: {github.sha} & `latest`   │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│  Stage 3: SSH Deploy to Server  │
│  Exec: `kubectl apply -f k8s/`  │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│  Stage 4: Rollout Status Check  │
└─────────────────────────────────┘
```

### 4.1. Mã kịch bản GitHub Actions (`.github/workflows/ci-cd.yml`)

```yaml
name: Smart Ticketing CI/CD Pipeline

on:
  push:
    branches: [ "main" ]

jobs:
  test-and-build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}

      - name: Build & Push Backend Image
        uses: docker/build-push-action@v5
        with:
          context: ./src/backend
          push: true
          tags: |
            ${{ secrets.DOCKERHUB_USERNAME }}/smart-ticketing-backend:${{ github.sha }}
            ${{ secrets.DOCKERHUB_USERNAME }}/smart-ticketing-backend:latest

      - name: Build & Push Worker Image
        uses: docker/build-push-action@v5
        with:
          context: ./src/worker
          push: true
          tags: |
            ${{ secrets.DOCKERHUB_USERNAME }}/smart-ticketing-worker:${{ github.sha }}
            ${{ secrets.DOCKERHUB_USERNAME }}/smart-ticketing-worker:latest

  deploy-to-k8s:
    needs: test-and-build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Cloud Server via SSH
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.CLOUD_SERVER_IP }}
          username: ubuntu
          key: ${{ secrets.CLOUD_SSH_PRIVATE_KEY }}
          script: |
            kubectl set image deployment/backend-api backend-api=${{ secrets.DOCKERHUB_USERNAME }}/smart-ticketing-backend:${{ github.sha }} -n smart-ticketing
            kubectl set image deployment/ai-worker ai-worker=${{ secrets.DOCKERHUB_USERNAME }}/smart-ticketing-worker:${{ github.sha }} -n smart-ticketing
            kubectl rollout status deployment/backend-api -n smart-ticketing
            kubectl rollout status deployment/ai-worker -n smart-ticketing
```

---

## 5. Danh mục Biến Môi trường (Environment Variables Catalog)

| Biến môi trường | Loại | Mô tả mẫu | Thành phần sử dụng |
| :--- | :--- | :--- | :--- |
| **PORT** | ConfigMap | `8080` | Backend API |
| **POSTGRES_HOST** | ConfigMap | `postgres-service.smart-ticketing.svc.cluster.local` | Backend, Worker |
| **POSTGRES_DB** | ConfigMap | `ticketing_db` | Backend, Worker |
| **POSTGRES_USER** | Secret | `postgres_admin` | Backend, Worker |
| **POSTGRES_PASSWORD** | Secret | `SecretDBPass2026!` | Backend, Worker |
| **REDIS_HOST** | ConfigMap | `redis-service.smart-ticketing.svc.cluster.local` | Backend, Worker |
| **RABBITMQ_HOST** | ConfigMap | `rabbitmq-service.smart-ticketing.svc.cluster.local` | Backend, Worker |
| **GEMINI_API_KEY** | Secret | `AIzaSy...` (Key Free Tier) | AI Worker Service |

---

## 6. Chiến lược Khôi phục & Cập nhật không gián đoạn (Zero-Downtime Rollout & Rollback)

* **RollingUpdate Strategy:** Mặc định Kubernetes thực hiện cập nhật theo luồng `maxSurge: 25%` và `maxUnavailable: 25%`, đảm bảo luôn có ít nhất $75\%$ số lượng Pods sẵn sàng phục vụ HTTP requests trong lúc deploy bản mới.
* **Kịch bản Rollback tức thì:** Nếu bản deploy mới gặp sự cố `CrashLoopBackOff` do lỗi code runtime:
  ```bash
  kubectl rollout undo deployment/backend-api -n smart-ticketing
  kubectl rollout undo deployment/ai-worker -n smart-ticketing
  ```
