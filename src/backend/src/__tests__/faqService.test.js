const faqService = require('../services/faqService');
const prisma = require('../config/prisma');
const redis = require('../config/redis');
const { mockReset } = require('jest-mock-extended');

// Mock Prisma
jest.mock('../config/prisma', () => require('jest-mock-extended').mockDeep());

// Mock Redis
jest.mock('../config/redis', () => ({
  getCache: jest.fn(),
  setCache: jest.fn(),
  deleteCacheByPattern: jest.fn(),
}));

describe('FAQ Service', () => {
  beforeEach(() => {
    mockReset(prisma);
    jest.clearAllMocks();
  });

  describe('createFaq', () => {
    it('should create FAQ and invalidate cache', async () => {
      const mockFaq = { id: 'faq-1', question: 'Q1', answer: 'A1', category: 'GENERAL', isActive: true };
      prisma.faq.create.mockResolvedValueOnce(mockFaq);

      const result = await faqService.createFaq({ question: 'Q1', answer: 'A1', category: 'GENERAL', isActive: true });

      expect(prisma.faq.create).toHaveBeenCalledWith({
        data: { question: 'Q1', answer: 'A1', category: 'GENERAL', isActive: true }
      });
      expect(redis.deleteCacheByPattern).toHaveBeenCalledWith('cache:faqs:*');
      expect(result).toEqual(mockFaq);
    });
  });

  describe('getAllFaqs', () => {
    it('should return from cache if cache hit', async () => {
      const mockFaqs = [{ id: 'faq-1', question: 'Q1' }];
      redis.getCache.mockResolvedValueOnce(mockFaqs);

      const result = await faqService.getAllFaqs({});

      expect(redis.getCache).toHaveBeenCalledWith('cache:faqs:all');
      expect(prisma.faq.findMany).not.toHaveBeenCalled();
      expect(result).toEqual(mockFaqs);
    });

    it('should query DB and set cache if cache miss', async () => {
      const mockFaqs = [{ id: 'faq-1', question: 'Q1' }];
      redis.getCache.mockResolvedValueOnce(null);
      prisma.faq.findMany.mockResolvedValueOnce(mockFaqs);

      const result = await faqService.getAllFaqs({ category: 'REFUND' });

      expect(redis.getCache).toHaveBeenCalledWith('cache:faqs:category:REFUND');
      expect(prisma.faq.findMany).toHaveBeenCalledWith({
        where: { isActive: true, category: 'REFUND' },
        orderBy: { createdAt: 'desc' }
      });
      expect(redis.setCache).toHaveBeenCalledWith('cache:faqs:category:REFUND', mockFaqs, 3600);
      expect(result).toEqual(mockFaqs);
    });
  });

  describe('getFaqById', () => {
    it('should throw error if not found', async () => {
      prisma.faq.findUnique.mockResolvedValueOnce(null);
      await expect(faqService.getFaqById('invalid-id')).rejects.toThrow('FAQ_NOT_FOUND');
    });

    it('should return FAQ if found', async () => {
      const mockFaq = { id: 'faq-1' };
      prisma.faq.findUnique.mockResolvedValueOnce(mockFaq);
      const result = await faqService.getFaqById('faq-1');
      expect(result).toEqual(mockFaq);
    });
  });

  describe('updateFaq', () => {
    it('should throw error if FAQ not found', async () => {
      prisma.faq.findUnique.mockResolvedValueOnce(null);
      await expect(faqService.updateFaq('invalid-id', {})).rejects.toThrow('FAQ_NOT_FOUND');
    });

    it('should update FAQ and invalidate cache', async () => {
      prisma.faq.findUnique.mockResolvedValueOnce({ id: 'faq-1' });
      prisma.faq.update.mockResolvedValueOnce({ id: 'faq-1', question: 'Updated Q' });

      const result = await faqService.updateFaq('faq-1', { question: 'Updated Q' });

      expect(prisma.faq.update).toHaveBeenCalledWith({
        where: { id: 'faq-1' },
        data: { question: 'Updated Q' }
      });
      expect(redis.deleteCacheByPattern).toHaveBeenCalledWith('cache:faqs:*');
      expect(result).toEqual({ id: 'faq-1', question: 'Updated Q' });
    });
  });

  describe('deleteFaq', () => {
    it('should throw error if FAQ not found', async () => {
      prisma.faq.findUnique.mockResolvedValueOnce(null);
      await expect(faqService.deleteFaq('invalid-id')).rejects.toThrow('FAQ_NOT_FOUND');
    });

    it('should delete FAQ and invalidate cache', async () => {
      prisma.faq.findUnique.mockResolvedValueOnce({ id: 'faq-1' });
      prisma.faq.delete.mockResolvedValueOnce({ id: 'faq-1' });

      const result = await faqService.deleteFaq('faq-1');

      expect(prisma.faq.delete).toHaveBeenCalledWith({ where: { id: 'faq-1' } });
      expect(redis.deleteCacheByPattern).toHaveBeenCalledWith('cache:faqs:*');
      expect(result).toBe(true);
    });
  });
});
