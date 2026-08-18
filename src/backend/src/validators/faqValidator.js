const { z } = require('zod');

const faqSchema = z.object({
  question: z.string().min(1, 'Câu hỏi không được để trống'),
  answer: z.string().min(1, 'Câu trả lời không được để trống'),
  category: z.string().min(1, 'Danh mục không được để trống'),
  isActive: z.boolean().optional().default(true),
});

const updateFaqSchema = z.object({
  question: z.string().min(1, 'Câu hỏi không được để trống').optional(),
  answer: z.string().min(1, 'Câu trả lời không được để trống').optional(),
  category: z.string().min(1, 'Danh mục không được để trống').optional(),
  isActive: z.boolean().optional(),
});

module.exports = {
  faqSchema,
  updateFaqSchema,
};
