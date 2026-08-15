const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const db = require('./config/database');
const redisClient = require('./config/redis');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
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
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error_code: err.code || 'INTERNAL_SERVER_ERROR'
  });
});

// Start Server
const startServer = async () => {
  try {
    // Kết nối Database & Redis
    await db.connect();
    await redisClient.connect();

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
