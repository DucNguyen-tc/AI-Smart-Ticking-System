const { z } = require('zod');

const createTicketSchema = z.object({
  title: z.string().min(1, 'Tiêu đề không được để trống').max(255, 'Tiêu đề tối đa 255 ký tự').trim(),
  content: z.string().min(1, 'Nội dung không được để trống'),
  serviceType: z.enum(['ECOMMERCE', 'SOFTWARE', 'PAYMENT', 'GENERAL']).optional().default('GENERAL')
});

const updateTicketSchema = z.object({
  title: z.string().min(1, 'Tiêu đề không được rỗng').max(255).trim().optional(),
  content: z.string().min(1, 'Nội dung không được rỗng').optional(),
  serviceType: z.enum(['ECOMMERCE', 'SOFTWARE', 'PAYMENT', 'GENERAL']).optional(),
  status: z.enum(['PENDING', 'PROCESSED', 'RESOLVED', 'CLOSED']).optional()
});

const replyTicketSchema = z.object({
  message: z.string().min(1, 'Nội dung phản hồi không được để trống'),
  isInternalNote: z.boolean().optional().default(false)
});

module.exports = {
  createTicketSchema,
  updateTicketSchema,
  replyTicketSchema
};
