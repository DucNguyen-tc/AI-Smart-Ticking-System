const ticketService = require('../services/ticketService');
const prisma = require('../config/prisma');
const redis = require('../config/redis');
const { mockReset } = require('jest-mock-extended');

// Mock Prisma
jest.mock('../config/prisma', () => require('jest-mock-extended').mockDeep());
// Mock RabbitMQ
jest.mock('../config/rabbitmq', () => ({
  publishMessage: jest.fn().mockResolvedValue(true),
}));
// Mock Redis
jest.mock('../config/redis', () => ({
  getCache: jest.fn(),
  setCache: jest.fn(),
  deleteCacheByPattern: jest.fn(),
}));


describe('Ticket Service', () => {
  beforeEach(() => {
    mockReset(prisma);
    jest.clearAllMocks();
  });

  describe('createTicket', () => {
    it('should successfully create a ticket', async () => {
      const mockTicket = {
        id: 'ticket-1',
        title: 'Hỏng mạng',
        content: 'Không truy cập được internet',
        userId: 'user-1',
        serviceType: 'GENERAL',
        status: 'PENDING',
      };
      
      prisma.ticket.create.mockResolvedValueOnce(mockTicket);

      const result = await ticketService.createTicket(
        { title: 'Hỏng mạng', content: 'Không truy cập được internet', serviceType: 'GENERAL' },
        'user-1'
      );

      expect(prisma.ticket.create).toHaveBeenCalledWith({
        data: {
          title: 'Hỏng mạng',
          content: 'Không truy cập được internet',
          serviceType: 'GENERAL',
          userId: 'user-1',
        },
        include: {
          user: expect.any(Object),
        },
      });
      expect(redis.deleteCacheByPattern).toHaveBeenCalledWith('cache:tickets:*');
      expect(result).toEqual(mockTicket);
    });
  });

  describe('getAllTickets', () => {
    it('should return all tickets for AGENT/ADMIN', async () => {
      const mockTickets = [
        { id: '1', title: 'Ticket 1', userId: 'user-1' },
        { id: '2', title: 'Ticket 2', userId: 'user-2' },
      ];
      prisma.ticket.findMany.mockResolvedValueOnce(mockTickets);
      prisma.ticket.count.mockResolvedValueOnce(2);

      const result = await ticketService.getAllTickets({}, 1, 10, { id: 'agent-1', role: 'AGENT' });

      expect(prisma.ticket.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
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
        include: expect.any(Object),
      });
      expect(result).toEqual({
        tickets: mockTickets,
        total: 2,
        stats: {
          urgent: 0,
          pending: 0,
          processed: 0,
          resolved: 0,
        },
      });
    });

    it('should filter only own tickets for CUSTOMER', async () => {
      prisma.ticket.findMany.mockResolvedValueOnce([]);
      prisma.ticket.count.mockResolvedValueOnce(0);

      await ticketService.getAllTickets({}, 1, 10, { id: 'customer-1', role: 'CUSTOMER' });

      expect(prisma.ticket.findMany).toHaveBeenCalledWith({
        where: { userId: 'customer-1' },
        skip: 0,
        take: 10,
        orderBy: expect.any(Object),
        include: expect.any(Object),
      });
    });

    it('should filter tickets by priority (AI Analysis)', async () => {
      prisma.ticket.findMany.mockResolvedValueOnce([]);
      prisma.ticket.count.mockResolvedValueOnce(0);

      await ticketService.getAllTickets({ priority: 'URGENT' }, 1, 10, { id: 'agent-1', role: 'AGENT' });

      expect(prisma.ticket.findMany).toHaveBeenCalledWith({
        where: {
          aiAnalysis: {
            priority: 'URGENT'
          }
        },
        skip: 0,
        take: 10,
        orderBy: expect.any(Object),
        include: expect.any(Object),
      });
    });

    it('should return from cache if cache hit', async () => {
      const mockResult = { tickets: [{ id: '1', title: 'Cached Ticket' }], total: 1 };
      redis.getCache.mockResolvedValueOnce(mockResult);

      const result = await ticketService.getAllTickets({}, 1, 10, { id: 'agent-1', role: 'AGENT' });

      expect(redis.getCache).toHaveBeenCalled();
      expect(prisma.ticket.findMany).not.toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });

    it('should query DB and set cache if cache miss', async () => {
      const mockTickets = [{ id: '1', title: 'DB Ticket' }];
      redis.getCache.mockResolvedValueOnce(null);
      prisma.ticket.findMany.mockResolvedValueOnce(mockTickets);
      prisma.ticket.count.mockResolvedValueOnce(1);

      const result = await ticketService.getAllTickets({}, 1, 10, { id: 'agent-1', role: 'AGENT' });

      const expectedResult = {
        tickets: mockTickets,
        total: 1,
        stats: {
          urgent: 0,
          pending: 0,
          processed: 0,
          resolved: 0,
        },
      };
      expect(redis.getCache).toHaveBeenCalled();
      expect(prisma.ticket.findMany).toHaveBeenCalled();
      expect(redis.setCache).toHaveBeenCalledWith(expect.any(String), expectedResult, 300);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getTicketById', () => {
    it('should throw error if ticket not found', async () => {
      prisma.ticket.findUnique.mockResolvedValueOnce(null);

      await expect(
        ticketService.getTicketById('invalid-id', { id: 'user-1', role: 'ADMIN' })
      ).rejects.toThrow('TICKET_NOT_FOUND');
    });

    it('should throw error if CUSTOMER tries to view someone else\'s ticket', async () => {
      const mockTicket = { id: 'ticket-1', userId: 'other-user' };
      prisma.ticket.findUnique.mockResolvedValueOnce(mockTicket);

      await expect(
        ticketService.getTicketById('ticket-1', { id: 'customer-1', role: 'CUSTOMER' })
      ).rejects.toThrow('FORBIDDEN');
    });

    it('should allow CUSTOMER to view own ticket', async () => {
      const mockTicket = { id: 'ticket-1', userId: 'customer-1' };
      prisma.ticket.findUnique.mockResolvedValueOnce(mockTicket);

      const result = await ticketService.getTicketById('ticket-1', { id: 'customer-1', role: 'CUSTOMER' });
      expect(result).toEqual(mockTicket);
    });

    it('should return from cache if cache hit', async () => {
      const mockTicket = { id: 'ticket-1', userId: 'customer-1' };
      redis.getCache.mockResolvedValueOnce(mockTicket);

      const result = await ticketService.getTicketById('ticket-1', { id: 'customer-1', role: 'CUSTOMER' });

      expect(redis.getCache).toHaveBeenCalledWith('cache:ticket:ticket-1');
      expect(prisma.ticket.findUnique).not.toHaveBeenCalled();
      expect(result).toEqual(mockTicket);
    });

    it('should query DB and set cache if cache miss', async () => {
      const mockTicket = { id: 'ticket-1', userId: 'customer-1' };
      redis.getCache.mockResolvedValueOnce(null);
      prisma.ticket.findUnique.mockResolvedValueOnce(mockTicket);

      const result = await ticketService.getTicketById('ticket-1', { id: 'customer-1', role: 'CUSTOMER' });

      expect(redis.getCache).toHaveBeenCalledWith('cache:ticket:ticket-1');
      expect(prisma.ticket.findUnique).toHaveBeenCalled();
      expect(redis.setCache).toHaveBeenCalledWith('cache:ticket:ticket-1', mockTicket, 300);
      expect(result).toEqual(mockTicket);
    });
  });

  describe('updateTicket', () => {
    it('should allow CUSTOMER to update title/content when PENDING', async () => {
      const mockTicket = { id: 'ticket-1', userId: 'customer-1', status: 'PENDING' };
      prisma.ticket.findUnique.mockResolvedValueOnce(mockTicket);
      prisma.ticket.update.mockResolvedValueOnce({ ...mockTicket, title: 'Updated' });

      const result = await ticketService.updateTicket(
        'ticket-1',
        { title: 'Updated' },
        { id: 'customer-1', role: 'CUSTOMER' }
      );

      expect(prisma.ticket.update).toHaveBeenCalledWith({
        where: { id: 'ticket-1' },
        data: { title: 'Updated' },
        include: expect.any(Object),
      });
      expect(redis.deleteCacheByPattern).toHaveBeenCalledWith('cache:tickets:*');
      expect(redis.deleteCacheByPattern).toHaveBeenCalledWith('cache:ticket:ticket-1');
      expect(result.title).toBe('Updated');
    });

    it('should throw error if CUSTOMER updates non-PENDING ticket', async () => {
      const mockTicket = { id: 'ticket-1', userId: 'customer-1', status: 'PROCESSED' };
      prisma.ticket.findUnique.mockResolvedValueOnce(mockTicket);

      await expect(
        ticketService.updateTicket('ticket-1', { title: 'Updated' }, { id: 'customer-1', role: 'CUSTOMER' })
      ).rejects.toThrow('CANNOT_UPDATE_NON_PENDING');
    });

    it('should allow AGENT to update status and serviceType', async () => {
      const mockTicket = { id: 'ticket-1', userId: 'customer-1', status: 'PENDING', serviceType: 'GENERAL' };
      prisma.ticket.findUnique.mockResolvedValueOnce(mockTicket);
      prisma.ticket.update.mockResolvedValueOnce({ ...mockTicket, status: 'PROCESSED' });

      await ticketService.updateTicket(
        'ticket-1',
        { status: 'PROCESSED', serviceType: 'ECOMMERCE' },
        { id: 'agent-1', role: 'AGENT' }
      );

      expect(prisma.ticket.update).toHaveBeenCalledWith({
        where: { id: 'ticket-1' },
        data: { status: 'PROCESSED', serviceType: 'ECOMMERCE' },
        include: expect.any(Object),
      });
    });
  });

  describe('deleteTicket', () => {
    it('should delete successfully if admin', async () => {
      prisma.ticket.findUnique.mockResolvedValueOnce({ id: 'ticket-1' });
      prisma.ticket.delete.mockResolvedValueOnce({ id: 'ticket-1' });

      const result = await ticketService.deleteTicket('ticket-1');

      expect(prisma.ticket.delete).toHaveBeenCalledWith({
        where: { id: 'ticket-1' },
      });
      expect(redis.deleteCacheByPattern).toHaveBeenCalledWith('cache:tickets:*');
      expect(redis.deleteCacheByPattern).toHaveBeenCalledWith('cache:ticket:ticket-1');
      expect(result).toBe(true);
    });
  });

  describe('replyTicket', () => {
    it('should throw error if ticket not found', async () => {
      prisma.ticket.findUnique.mockResolvedValueOnce(null);

      await expect(
        ticketService.replyTicket('invalid-id', { id: 'agent-1' }, { message: 'Reply' })
      ).rejects.toThrow('TICKET_NOT_FOUND');
    });

    it('should create reply and update ticket status to RESOLVED if isInternalNote = false', async () => {
      const mockTicket = { id: 'ticket-1', status: 'PENDING' };
      const mockReply = {
        id: 'reply-1',
        ticketId: 'ticket-1',
        senderId: 'agent-1',
        message: 'Tôi đã xử lý',
        isInternalNote: false,
      };

      prisma.ticket.findUnique.mockResolvedValueOnce(mockTicket);
      
      // Giả lập Prisma Transaction
      prisma.$transaction.mockImplementationOnce(async (callback) => {
        return callback(prisma);
      });

      prisma.reply.create.mockResolvedValueOnce(mockReply);
      prisma.ticket.update.mockResolvedValueOnce({ ...mockTicket, status: 'RESOLVED' });

      const result = await ticketService.replyTicket(
        'ticket-1',
        { id: 'agent-1' },
        { message: 'Tôi đã xử lý', isInternalNote: false }
      );

      expect(prisma.reply.create).toHaveBeenCalledWith({
        data: {
          ticketId: 'ticket-1',
          senderId: 'agent-1',
          message: 'Tôi đã xử lý',
          isInternalNote: false,
        },
        include: expect.any(Object),
      });

      expect(prisma.ticket.update).toHaveBeenCalledWith({
        where: { id: 'ticket-1' },
        data: { status: 'RESOLVED' },
      });
      expect(redis.deleteCacheByPattern).toHaveBeenCalledWith('cache:tickets:*');
      expect(redis.deleteCacheByPattern).toHaveBeenCalledWith('cache:ticket:ticket-1');
      expect(result).toEqual(mockReply);
    });

    it('should create reply and NOT update ticket status if isInternalNote = true', async () => {
      const mockTicket = { id: 'ticket-1', status: 'PENDING' };
      const mockReply = {
        id: 'reply-1',
        ticketId: 'ticket-1',
        senderId: 'agent-1',
        message: 'Ghi chú nội bộ',
        isInternalNote: true,
      };

      prisma.ticket.findUnique.mockResolvedValueOnce(mockTicket);
      
      prisma.$transaction.mockImplementationOnce(async (callback) => {
        return callback(prisma);
      });

      prisma.reply.create.mockResolvedValueOnce(mockReply);

      const result = await ticketService.replyTicket(
        'ticket-1',
        { id: 'agent-1' },
        { message: 'Ghi chú nội bộ', isInternalNote: true }
      );

      expect(prisma.reply.create).toHaveBeenCalledWith({
        data: {
          ticketId: 'ticket-1',
          senderId: 'agent-1',
          message: 'Ghi chú nội bộ',
          isInternalNote: true,
        },
        include: expect.any(Object),
      });

      // Đảm bảo không gọi cập nhật ticket
      expect(prisma.ticket.update).not.toHaveBeenCalled();
      expect(result).toEqual(mockReply);
    });
  });
});
