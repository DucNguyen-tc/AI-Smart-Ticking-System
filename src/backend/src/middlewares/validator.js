const { z } = require('zod');
const { sendError } = require('../utils/response');

/**
 * Middleware tổng quát để validate request body bằng Zod Schema
 */
const validateSchema = (schema) => {
  return (req, res, next) => {
    try {
      // Xác thực dữ liệu
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Lấy thông báo lỗi đầu tiên từ Zod
        const errorMessage = (error.errors || error.issues || []).map(e => e.message).join(', ');
        
        return sendError(res, {
          code: 400,
          message: errorMessage,
          errorCode: 'INVALID_INPUT'
        });
      }
      next(error);
    }
  };
};

module.exports = {
  validateSchema
};

