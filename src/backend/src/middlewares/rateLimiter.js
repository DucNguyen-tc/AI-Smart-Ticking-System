const { incrementCache, expireCache } = require('../config/redis');
const { sendError } = require('../utils/response');

const createRateLimiter = (limit = 5, windowInSeconds = 60) => {
  return async (req, res, next) => {
    try {
      // 1. Tìm identifier (Ưu tiên user ID, sau đó tới IP)
      let identifier = null;
      let keyPrefix = '';

      if (req.user && req.user.id) {
        identifier = req.user.id;
        keyPrefix = 'rate_limit:user:';
      } else {
        identifier = req.headers['x-forwarded-for'] || req.ip;
        keyPrefix = 'rate_limit:ip:';
      }

      if (!identifier) {
        // Fallback an toàn, cho phép đi tiếp nếu không thể xác định
        return next();
      }

      const cacheKey = `${keyPrefix}${identifier}`;

      // 2. Tăng giá trị đếm
      const currentCount = await incrementCache(cacheKey);

      // Nếu redis mất kết nối hoặc lỗi, cho đi qua để hệ thống không chết
      if (currentCount === null) {
        return next();
      }

      // 3. Nếu là request đầu tiên, set TTL (Time-To-Live)
      if (currentCount === 1) {
        await expireCache(cacheKey, windowInSeconds);
      }

      // 4. Kiểm tra ngưỡng
      if (currentCount > limit) {
        return sendError(res, {
          code: 429,
          message: 'Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau 60 giây.',
          errorCode: 'RATE_LIMIT_EXCEEDED',
        });
      }

      next();
    } catch (error) {
      console.error('Rate Limiter Error:', error);
      next(); // Cho phép đi tiếp thay vì chặn request khi có lỗi nội bộ từ limiter
    }
  };
};

module.exports = {
  createRateLimiter,
};
