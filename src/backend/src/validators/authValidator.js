const { z } = require('zod');

const registerSchema = z.object({
  email: z.string().min(1, 'Email không được để trống').email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải từ 6 ký tự trở lên'),
  name: z.string().min(1, 'Họ và tên không được để trống').trim()
});

const loginSchema = z.object({
  email: z.string().min(1, 'Vui lòng cung cấp email').email('Email không hợp lệ'),
  password: z.string().min(1, 'Vui lòng cung cấp mật khẩu')
});

module.exports = {
  registerSchema,
  loginSchema
};
