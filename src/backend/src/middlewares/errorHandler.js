const { sendError } = require('../utils/response');

/**
 * Middleware xử lý lỗi tập trung (Global Error Handler)
 * Bắt toàn bộ lỗi chưa được xử lý trong ứng dụng, log stack trace và trả về format chuẩn.
 */
const errorHandler = (err, req, res, next) => {
  // Log chi tiết stack trace của lỗi để phục vụ debug
  console.error('Unhandled Error:', err.stack || err);

  // Xác định HTTP Status Code (mặc định là 500)
  const code = err.statusCode || err.status || 500;
  
  // Xác định thông điệp lỗi
  const message = err.message || 'Internal Server Error';
  
  // Xác định mã lỗi nghiệp vụ (Business Error Code)
  const errorCode = err.errorCode || err.code || 'INTERNAL_SERVER_ERROR';

  // Trả về response lỗi đúng chuẩn API_SPECIFICATION.md
  return sendError(res, {
    code,
    message,
    errorCode,
    // Đính kèm stack trace chi tiết ở môi trường phát triển (development) để dễ debug
    data: process.env.NODE_ENV === 'development' ? { stack: err.stack } : null
  });
};

module.exports = errorHandler;
