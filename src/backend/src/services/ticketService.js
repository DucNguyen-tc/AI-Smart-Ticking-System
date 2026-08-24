const prisma = require('../config/prisma');
const rabbitmq = require('../config/rabbitmq');
const { getCache, setCache, deleteCacheByPattern } = require('../config/redis');

/**
 * Hủy cache của Ticket khi có thay đổi (Create/Update/Delete/Reply)
 */
const invalidateTicketCache = async (ticketId) => {
  try {
    await deleteCacheByPattern('cache:tickets:*');
    if (ticketId) {
      await deleteCacheByPattern(`cache:ticket:${ticketId}`);
    }
  } catch (error) {
    console.error('Failed to invalidate ticket cache:', error.message);
  }
};


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

  await invalidateTicketCache();

  return ticket;
};

/**
 * Lấy danh sách Ticket có phân trang và filter
 */
const getAllTickets = async (filters = {}, page = 1, limit = 10, actor) => {
  // Tạo cacheKey định danh duy nhất dựa trên vai trò, user và các bộ lọc
  const cacheKey = `cache:tickets:list:role:${actor.role}:user:${actor.role === 'CUSTOMER' ? actor.id : 'all'}:filters:${JSON.stringify(filters)}:page:${page}:limit:${limit}`;
  
  // Kiểm tra Redis cache trước
  const cachedData = await getCache(cacheKey);
  if (cachedData) {
    return cachedData;
  }

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

  // Bộ lọc theo từ khóa tìm kiếm (title hoặc tên khách hàng)
  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { user: { name: { contains: filters.search, mode: 'insensitive' } } },
    ];
  }

  // Fetch tickets, count total, and compute stats if AGENT/ADMIN
  const queryPromises = [
    prisma.ticket.findMany({
      where,
      skip,
      take: limit,
      orderBy: [
        {
          aiAnalysis: {
            priority: 'desc'
          }
        },
        {
          aiAnalysis: {
            sentiment: 'desc'
          }
        },
        {
          createdAt: 'desc'
        }
      ],
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
  ];

  if (actor.role === 'AGENT' || actor.role === 'ADMIN') {
    queryPromises.push(
      prisma.ticket.count({ where: { aiAnalysis: { priority: 'URGENT' } } }),
      prisma.ticket.count({ where: { status: 'PENDING' } }),
      prisma.ticket.count({ where: { status: 'PROCESSED' } }),
      prisma.ticket.count({ where: { status: 'RESOLVED' } })
    );
  }

  const queryResults = await Promise.all(queryPromises);
  const tickets = queryResults[0];
  const total = queryResults[1];
  
  let stats = undefined;
  if (actor.role === 'AGENT' || actor.role === 'ADMIN') {
    stats = {
      urgent: queryResults[2] || 0,
      pending: queryResults[3] || 0,
      processed: queryResults[4] || 0,
      resolved: queryResults[5] || 0,
    };
  }

  const result = { tickets, total, stats };

  // Lưu vào Redis cache với TTL 5 phút (300 giây)
  await setCache(cacheKey, result, 300);

  return result;
};

/**
 * Lấy chi tiết Ticket
 */
const getTicketById = async (id, actor) => {
  const cacheKey = `cache:ticket:${id}`;
  
  // Kiểm tra Redis cache trước
  const cachedTicket = await getCache(cacheKey);
  if (cachedTicket) {
    // Kiểm tra quyền sở hữu đối với CUSTOMER từ cache
    if (actor.role === 'CUSTOMER' && cachedTicket.userId !== actor.id) {
      throw new Error('FORBIDDEN');
    }
    return cachedTicket;
  }

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

  // Lưu vào Redis cache với TTL 5 phút (300 giây)
  await setCache(cacheKey, ticket, 300);

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

  await invalidateTicketCache(id);

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

  await invalidateTicketCache(id);

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

  await invalidateTicketCache(ticketId);

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
