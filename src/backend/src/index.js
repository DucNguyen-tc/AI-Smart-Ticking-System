const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const prisma = require('./config/prisma');
const redisClient = require('./config/redis');
const rabbitmq = require('./config/rabbitmq');

const errorHandler = require('./middlewares/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const faqRoutes = require('./routes/faqRoutes');

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/tickets', ticketRoutes);
app.use('/api/v1/faqs', faqRoutes);
app.get('/api/v1/health', async (req, res, next) => {
  try {
    // Trả về OK nếu ứng dụng hoạt động bình thường
    res.status(200).json({
      success: true,
      message: 'OK'
    });
  } catch (error) {
    next(error);
  }
});

// Global Error Handler
app.use(errorHandler);

// Start Server
const startServer = async () => {
  try {
    // Kết nối Database, Redis & RabbitMQ
    await prisma.$connect();
    await redisClient.connect();
    await rabbitmq.connect();

    const server = app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });

    // Graceful Shutdown Handler
    const shutdown = async (signal) => {
      console.log(`Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        console.log('HTTP server closed.');
        await prisma.$disconnect();
        console.log('Database disconnected.');
        await redisClient.client.quit();
        console.log('Redis disconnected.');
        await rabbitmq.close();
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
