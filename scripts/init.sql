-- Kích hoạt extension hỗ trợ sinh UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tạo các kiểu ENUM (để khớp với Prisma Schema)
CREATE TYPE "Role" AS ENUM ('CUSTOMER', 'AGENT', 'ADMIN');
CREATE TYPE "ServiceType" AS ENUM ('ECOMMERCE', 'SOFTWARE', 'PAYMENT', 'GENERAL');
CREATE TYPE "TicketStatus" AS ENUM ('PENDING', 'PROCESSED', 'RESOLVED', 'CLOSED');
CREATE TYPE "Sentiment" AS ENUM ('POSITIVE', 'NEUTRAL', 'ANGRY');
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- 1. Tạo Bảng USERS
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role "Role" NOT NULL DEFAULT 'CUSTOMER',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Tạo Bảng TICKETS
CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    service_type "ServiceType" NOT NULL DEFAULT 'GENERAL',
    status "TicketStatus" NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Tạo Bảng AI_ANALYSES
CREATE TABLE IF NOT EXISTS ai_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID UNIQUE NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    sentiment "Sentiment" NOT NULL,
    priority "Priority" NOT NULL,
    category VARCHAR(50) NOT NULL,
    summary TEXT NOT NULL,
    suggested_reply TEXT NOT NULL,
    confidence_score NUMERIC(3,2) DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Tạo Bảng REPLIES
CREATE TABLE IF NOT EXISTS replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_internal_note BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Tạo Bảng FAQS
CREATE TABLE IF NOT EXISTS faqs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CHIẾN LƯỢC ĐÁNH INDEX
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status_created ON tickets(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_ticket_id ON ai_analyses(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_priority ON ai_analyses(priority);
