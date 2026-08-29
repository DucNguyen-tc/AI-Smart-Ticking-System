const prisma = require('../config/prisma');
const { getCache, setCache, deleteCacheByPattern } = require('../config/redis');

/**
 * Xóa cache của FAQ khi có thay đổi (Create/Update/Delete)
 */
const invalidateFaqCache = async () => {
  await deleteCacheByPattern('cache:faqs:*');
};

/**
 * Tạo mới FAQ
 */
const createFaq = async (data) => {
  const faq = await prisma.faq.create({
    data: {
      question: data.question,
      answer: data.answer,
      category: data.category,
      isActive: data.isActive,
    },
  });

  await invalidateFaqCache();
  return faq;
};

/**
 * Lấy danh sách FAQ (có dùng Redis Cache)
 */
const getAllFaqs = async (filters = {}) => {
  // Tạo cache key dựa trên filter
  const cacheKey = filters.category 
    ? `cache:faqs:category:${filters.category}` 
    : 'cache:faqs:all';

  // Thử lấy từ cache trước
  const cachedData = await getCache(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  // Nếu Cache Miss, query DB
  const where = { isActive: true };
  if (filters.category) {
    where.category = filters.category;
  }

  const faqs = await prisma.faq.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  // Lưu vào Redis (TTL 1 giờ = 3600 giây)
  await setCache(cacheKey, faqs, 3600);

  return faqs;
};

/**
 * Lấy chi tiết 1 FAQ
 */
const getFaqById = async (id) => {
  const faq = await prisma.faq.findUnique({
    where: { id },
  });

  if (!faq) {
    throw new Error('FAQ_NOT_FOUND');
  }
  return faq;
};

/**
 * Cập nhật FAQ
 */
const updateFaq = async (id, data) => {
  const faq = await prisma.faq.findUnique({
    where: { id },
  });

  if (!faq) {
    throw new Error('FAQ_NOT_FOUND');
  }

  const updatedFaq = await prisma.faq.update({
    where: { id },
    data: {
      ...(data.question && { question: data.question }),
      ...(data.answer && { answer: data.answer }),
      ...(data.category && { category: data.category }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
  });

  await invalidateFaqCache();
  return updatedFaq;
};

/**
 * Xóa FAQ
 */
const deleteFaq = async (id) => {
  const faq = await prisma.faq.findUnique({
    where: { id },
  });

  if (!faq) {
    throw new Error('FAQ_NOT_FOUND');
  }

  await prisma.faq.delete({
    where: { id },
  });

  await invalidateFaqCache();
  return true;
};

module.exports = {
  createFaq,
  getAllFaqs,
  getFaqById,
  updateFaq,
  deleteFaq,
};
