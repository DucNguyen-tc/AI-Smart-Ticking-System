const jwt = require('jsonwebtoken');
const { sendError } = require('../utils/response');

/**
 * Middleware xác thực (Authentication)
 * Kiểm tra xem request có chứa token hợp lệ không
 */
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, {
        code: 401,
        message: 'Vui lòng đăng nhập để truy cập',
        errorCode: 'UNAUTHORIZED'
      });
    }

    const token = authHeader.split(' ')[1];
    
    // Giải mã token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Lưu thông tin user vào request để các middleware/controller sau sử dụng
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return sendError(res, {
        code: 401,
        message: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại',
        errorCode: 'TOKEN_EXPIRED'
      });
    }
    
    return sendError(res, {
      code: 401,
      message: 'Token không hợp lệ',
      errorCode: 'INVALID_TOKEN'
    });
  }
};

/**
 * Middleware phân quyền (Authorization)
 * @param {...string} roles - Danh sách các role được phép truy cập
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return sendError(res, {
        code: 403,
        message: 'Bạn không có quyền thực hiện hành động này',
        errorCode: 'FORBIDDEN'
      });
    }
    next();
  };
};

module.exports = {
  authenticate,
  authorize
};
