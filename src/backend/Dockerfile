# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci
RUN npx prisma generate
RUN npm prune --production

# Stage 2: Runtime
FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache wget \
    && addgroup -g 10001 appgroup && adduser -u 10001 -G appgroup -D appuser
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY src/ ./src/
COPY package.json ./
USER appuser
EXPOSE 8080
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --spider -q http://localhost:8080/api/v1/health || exit 1
CMD ["node", "src/index.js"]