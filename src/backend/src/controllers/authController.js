const authService = require('../services/authService');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * Đăng ký người dùng mới
 */
const register = async (req, res, next) => {
  try {
    const user = await authService.register(req.body);

    return sendSuccess(res, {
      code: 201,
      message: 'Đăng ký tài khoản thành công',
      data: { user }
    });
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, {
        code: error.statusCode,
        message: error.message,
        errorCode: error.code
      });
    }
    next(error);
  }
};

/**
 * Đăng nhập
 */
const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);

    return sendSuccess(res, {
      code: 200,
      message: 'Đăng nhập thành công',
      data: result
    });
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, {
        code: error.statusCode,
        message: error.message,
        errorCode: error.code
      });
    }
    next(error);
  }
};

module.exports = {
  register,
  login
};
