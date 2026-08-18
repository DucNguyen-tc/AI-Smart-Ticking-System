const prisma = require('../config/prisma');
const rabbitmq = require('../config/rabbitmq');

/**
 * Tạo mới Ticket
 */
const createTicket = async (data, actorId) => {
  const ticket = await prisma.ticket.create({
    data: {
      ...data,
      userId: actorId, // Chỉ user sở hữu mới tạo được (lấy từ req.user.id)
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      },
    },
  });

  // Gửi sự kiện TICKET_CREATED tới RabbitMQ bất đồng bộ
  try {
    await rabbitmq.publishMessage('ticket.created.key', { ticketId: ticket.id });
    console.log(`Published TICKET_CREATED event for ticket_id: ${ticket.id}`);
  } catch (error) {
    console.error(`Failed to publish TICKET_CREATED event for ticket_id ${ticket.id}:`, error.message);
    // Vẫn trả về ticket đã được lưu thành công, không chặn luồng chính
  }

  return ticket;
};

/**
 * Lấy danh sách Ticket có phân trang và filter
 */
const getAllTickets = async (filters = {}, page = 1, limit = 10, actor) => {
  const skip = (page - 1) * limit;
  
  const where = {};
  
  // Nếu là CUSTOMER, chỉ cho phép lấy Ticket của chính họ
  if (actor.role === 'CUSTOMER') {
    where.userId = actor.id;
  } else if (filters.userId) {
    where.userId = filters.userId;
  }

  // Bộ lọc trạng thái và loại dịch vụ
  if (filters.status) {
    where.status = filters.status;
  }
  if (filters.serviceType) {
    where.serviceType = filters.serviceType;
  }

  // Bộ lọc nâng cao theo AI Analysis (LEFT JOIN under-the-hood)
  if (filters.priority || filters.sentiment || filters.category) {
    where.aiAnalysis = {
      ...(filters.priority && { priority: filters.priority }),
      ...(filters.sentiment && { sentiment: filters.sentiment }),
      ...(filters.category && { category: filters.category }),
    };
  }

  const [tickets, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
        aiAnalysis: true, // Trả kèm phân tích AI
      },
    }),
    prisma.ticket.count({ where }),
  ]);

  return { tickets, total };
};

/**
 * Lấy chi tiết Ticket
 */
const getTicketById = async (id, actor) => {
  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      },
      aiAnalysis: true, // Bao gồm phân tích AI (nếu có)
      replies: {
        include: {
          sender: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc', // Phản hồi cũ xếp trước, mới xếp sau
        },
      },
    },
  });

  if (!ticket) {
    throw new Error('TICKET_NOT_FOUND');
  }

  // Kiểm tra quyền sở hữu đối với CUSTOMER
  if (actor.role === 'CUSTOMER' && ticket.userId !== actor.id) {
    throw new Error('FORBIDDEN');
  }

  return ticket;
};

/**
 * Cập nhật Ticket
 */
const updateTicket = async (id, data, actor) => {
  const ticket = await prisma.ticket.findUnique({
    where: { id },
  });

  if (!ticket) {
    throw new Error('TICKET_NOT_FOUND');
  }

  const updateData = {};

  if (actor.role === 'CUSTOMER') {
    // Kiểm tra quyền sở hữu
    if (ticket.userId !== actor.id) {
      throw new Error('FORBIDDEN');
    }

    // CUSTOMER chỉ được update khi trạng thái là PENDING
    if (ticket.status !== 'PENDING') {
      throw new Error('CANNOT_UPDATE_NON_PENDING');
    }

    // CUSTOMER chỉ được update title, content và chuyển status thành CLOSED
    if (data.title) updateData.title = data.title;
    if (data.content) updateData.content = data.content;
    if (data.status === 'CLOSED') updateData.status = 'CLOSED';
    
    // Nếu truyền status khác CLOSED thì báo lỗi hoặc phớt lờ
    if (data.status && data.status !== 'CLOSED') {
      throw new Error('CUSTOMER_CAN_ONLY_CLOSE_TICKET');
    }
  } else {
    // AGENT/ADMIN được sửa status và serviceType
    if (data.status) updateData.status = data.status;
    if (data.serviceType) updateData.serviceType = data.serviceType;
    
    // Agent/Admin không tự ý sửa title/content của khách hàng (hoặc nếu có thì có thể thêm vào sau, hiện tại chỉ tập trung cập nhật trạng thái/dịch vụ)
  }

  if (Object.keys(updateData).length === 0) {
    throw new Error('NO_VALID_FIELDS_TO_UPDATE');
  }

  const updatedTicket = await prisma.ticket.update({
    where: { id },
    data: updateData,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      },
    },
  });

  return updatedTicket;
};

/**
 * Xóa Ticket (Chỉ ADMIN)
 */
const deleteTicket = async (id) => {
  const ticket = await prisma.ticket.findUnique({
    where: { id },
  });

  if (!ticket) {
    throw new Error('TICKET_NOT_FOUND');
  }

  await prisma.ticket.delete({
    where: { id },
  });

  return true;
};

/**
 * Gửi phản hồi (Reply) cho Ticket (Chỉ AGENT/ADMIN)
 */
const replyTicket = async (ticketId, actor, data) => {
  // Kiểm tra sự tồn tại của ticket
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
  });

  if (!ticket) {
    throw new Error('TICKET_NOT_FOUND');
  }

  // Thực hiện transaction: Ghi reply và Cập nhật trạng thái ticket
  const [newReply] = await prisma.$transaction(async (tx) => {
    // 1. Tạo bản ghi reply
    const reply = await tx.reply.create({
      data: {
        ticketId,
        senderId: actor.id,
        message: data.message,
        isInternalNote: data.isInternalNote ?? false,
      },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
    });

    // 2. Cập nhật ticket status sang RESOLVED nếu isInternalNote = false
    if (!data.isInternalNote) {
      await tx.ticket.update({
        where: { id: ticketId },
        data: { status: 'RESOLVED' },
      });
    }

    return [reply];
  });

  return newReply;
};

module.exports = {
  createTicket,
  getAllTickets,
  getTicketById,
  updateTicket,
  deleteTicket,
  replyTicket,
};
