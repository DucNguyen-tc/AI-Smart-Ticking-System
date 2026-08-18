const ticketService = require('../services/ticketService');
const { sendSuccess, sendError } = require('../utils/response');

const create = async (req, res, next) => {
  try {
    // req.user được sinh ra từ authenticate middleware
    const ticket = await ticketService.createTicket(req.body, req.user.id);
    
    return sendSuccess(res, {
      code: 201,
      message: 'Tạo Ticket thành công',
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
};

const getAll = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const filters = {
      status: req.query.status,
      serviceType: req.query.serviceType,
      userId: req.query.userId,
      priority: req.query.priority,
      sentiment: req.query.sentiment,
      category: req.query.category,
    };

    const { tickets, total } = await ticketService.getAllTickets(filters, page, limit, req.user);

    return sendSuccess(res, {
      message: 'Lấy danh sách Ticket thành công',
      data: tickets,
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
    const ticket = await ticketService.getTicketById(id, req.user);

    return sendSuccess(res, {
      message: 'Lấy chi tiết Ticket thành công',
      data: ticket,
    });
  } catch (error) {
    if (error.message === 'TICKET_NOT_FOUND') {
      return sendError(res, {
        code: 404,
        message: 'Không tìm thấy Ticket',
        errorCode: 'TICKET_NOT_FOUND',
      });
    }
    if (error.message === 'FORBIDDEN') {
      return sendError(res, {
        code: 403,
        message: 'Bạn không có quyền xem Ticket này',
        errorCode: 'FORBIDDEN',
      });
    }
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updatedTicket = await ticketService.updateTicket(id, req.body, req.user);

    return sendSuccess(res, {
      message: 'Cập nhật Ticket thành công',
      data: updatedTicket,
    });
  } catch (error) {
    if (error.message === 'TICKET_NOT_FOUND') {
      return sendError(res, {
        code: 404,
        message: 'Không tìm thấy Ticket',
        errorCode: 'TICKET_NOT_FOUND',
      });
    }
    if (error.message === 'FORBIDDEN') {
      return sendError(res, {
        code: 403,
        message: 'Bạn không có quyền cập nhật Ticket này',
        errorCode: 'FORBIDDEN',
      });
    }
    if (error.message === 'CANNOT_UPDATE_NON_PENDING') {
      return sendError(res, {
        code: 400,
        message: 'Chỉ được phép cập nhật Ticket khi trạng thái là PENDING',
        errorCode: 'CANNOT_UPDATE_NON_PENDING',
      });
    }
    if (error.message === 'CUSTOMER_CAN_ONLY_CLOSE_TICKET') {
      return sendError(res, {
        code: 400,
        message: 'Khách hàng chỉ được phép cập nhật trạng thái thành CLOSED',
        errorCode: 'BAD_REQUEST',
      });
    }
    if (error.message === 'NO_VALID_FIELDS_TO_UPDATE') {
      return sendError(res, {
        code: 400,
        message: 'Không có trường dữ liệu hợp lệ nào được cập nhật',
        errorCode: 'BAD_REQUEST',
      });
    }
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    await ticketService.deleteTicket(id);

    return sendSuccess(res, {
      message: 'Xóa Ticket thành công',
      data: null,
    });
  } catch (error) {
    if (error.message === 'TICKET_NOT_FOUND') {
      return sendError(res, {
        code: 404,
        message: 'Không tìm thấy Ticket',
        errorCode: 'TICKET_NOT_FOUND',
      });
    }
    next(error);
  }
};

const reply = async (req, res, next) => {
  try {
    const { id } = req.params;
    const newReply = await ticketService.replyTicket(id, req.user, req.body);

    return sendSuccess(res, {
      code: 201,
      message: 'Gửi phản hồi thành công',
      data: newReply,
    });
  } catch (error) {
    if (error.message === 'TICKET_NOT_FOUND') {
      return sendError(res, {
        code: 404,
        message: 'Không tìm thấy Ticket',
        errorCode: 'TICKET_NOT_FOUND',
      });
    }
    next(error);
  }
};

module.exports = {
  create,
  getAll,
  getById,
  update,
  remove,
  reply,
};
