const { z } = require('zod');

// Schema for creating a user
const createUserSchema = z.object({
  email: z.string().min(1, 'Email không được để trống').email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải từ 6 ký tự trở lên'),
  name: z.string().min(1, 'Họ và tên không được để trống').trim(),
  role: z.enum(['CUSTOMER', 'AGENT', 'ADMIN']).optional().default('CUSTOMER'),
});

// Schema for updating a user (password update not included based on requirements)
const updateUserSchema = z.object({
  email: z.string().email('Email không hợp lệ').optional(),
  name: z.string().trim().min(1, 'Họ và tên không được rỗng').optional(),
  role: z.enum(['CUSTOMER', 'AGENT', 'ADMIN']).optional(),
});

module.exports = {
  createUserSchema,
  updateUserSchema,
};
