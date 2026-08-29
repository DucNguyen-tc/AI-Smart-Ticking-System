const { z } = require('zod');

const faqSchema = z.object({
  question: z.string().min(1, 'Câu hỏi không được để trống'),
  answer: z.string().min(1, 'Câu trả lời không được để trống'),
  category: z.enum(['GENERAL', 'ECOMMERCE', 'SOFTWARE', 'PAYMENT'], { 
    errorMap: () => ({ message: 'Danh mục không hợp lệ' }) 
  }),
  isActive: z.boolean().optional().default(true),
});

const updateFaqSchema = z.object({
  question: z.string().min(1, 'Câu hỏi không được để trống').optional(),
  answer: z.string().min(1, 'Câu trả lời không được để trống').optional(),
  category: z.enum(['GENERAL', 'ECOMMERCE', 'SOFTWARE', 'PAYMENT'], { 
    errorMap: () => ({ message: 'Danh mục không hợp lệ' }) 
  }).optional(),
  isActive: z.boolean().optional(),
});

module.exports = {
  faqSchema,
  updateFaqSchema,
};
