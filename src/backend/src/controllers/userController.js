const userService = require('../services/userService');
const { sendSuccess, sendError } = require('../utils/response');

const getAll = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const { users, total } = await userService.getAllUsers(page, limit);

    return sendSuccess(res, {
      message: 'Lấy danh sách người dùng thành công',
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Kiểm tra quyền: Chỉ ADMIN, AGENT hoặc chính user đó mới được xem thông tin chi tiết
    if (req.user.role !== 'ADMIN' && req.user.role !== 'AGENT' && req.user.id !== id) {
      return sendError(res, {
        code: 403,
        message: 'Bạn không có quyền truy cập thông tin này',
        errorCode: 'FORBIDDEN',
      });
    }

    const user = await userService.getUserById(id);
    if (!user) {
      return sendError(res, {
        code: 404,
        message: 'Không tìm thấy người dùng',
        errorCode: 'USER_NOT_FOUND',
      });
    }

    return sendSuccess(res, {
      message: 'Lấy thông tin người dùng thành công',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const newUser = await userService.createUser(req.body);

    return sendSuccess(res, {
      code: 201,
      message: 'Tạo người dùng thành công',
      data: newUser,
    });
  } catch (error) {
    if (error.message === 'EMAIL_EXISTS') {
      return sendError(res, {
        code: 400,
        message: 'Email đã được sử dụng',
        errorCode: 'EMAIL_EXISTS',
      });
    }
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Kiểm tra quyền: Chỉ ADMIN hoặc chính user đó mới được cập nhật
    if (req.user.role !== 'ADMIN' && req.user.id !== id) {
      return sendError(res, {
        code: 403,
        message: 'Bạn không có quyền cập nhật thông tin này',
        errorCode: 'FORBIDDEN',
      });
    }

    // Nếu không phải ADMIN, không cho phép cập nhật role
    if (req.user.role !== 'ADMIN' && req.body.role) {
      delete req.body.role;
    }

    const updatedUser = await userService.updateUser(id, req.body);

    return sendSuccess(res, {
      message: 'Cập nhật người dùng thành công',
      data: updatedUser,
    });
  } catch (error) {
    if (error.message === 'USER_NOT_FOUND') {
      return sendError(res, {
        code: 404,
        message: 'Không tìm thấy người dùng',
        errorCode: 'USER_NOT_FOUND',
      });
    }
    if (error.message === 'EMAIL_EXISTS') {
      return sendError(res, {
        code: 400,
        message: 'Email đã được sử dụng',
        errorCode: 'EMAIL_EXISTS',
      });
    }
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const { id } = req.params;

    await userService.deleteUser(id);

    return sendSuccess(res, {
      message: 'Xóa người dùng thành công',
      data: null,
    });
  } catch (error) {
    if (error.message === 'USER_NOT_FOUND') {
      return sendError(res, {
        code: 404,
        message: 'Không tìm thấy người dùng',
        errorCode: 'USER_NOT_FOUND',
      });
    }
    next(error);
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
};
