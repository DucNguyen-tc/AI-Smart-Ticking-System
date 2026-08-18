const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

// Khởi tạo Pool kết nối PG
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

// Khởi tạo một PrismaClient duy nhất thông qua Adapter
const prisma = new PrismaClient({ adapter });

module.exports = prisma;
