const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');

/**
 * Lấy danh sách users có phân trang
 */
const getAllUsers = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.user.count(),
  ]);

  return { users, total };
};

/**
 * Lấy user theo ID
 */
const getUserById = async (id) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return user;
};

/**
 * Tạo user mới
 */
const createUser = async (data) => {
  // Kiểm tra email đã tồn tại chưa
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw new Error('EMAIL_EXISTS');
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(data.password, salt);

  const newUser = await prisma.user.create({
    data: {
      ...data,
      password: hashedPassword,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return newUser;
};

/**
 * Cập nhật thông tin user
 */
const updateUser = async (id, data) => {
  // Kiểm tra user có tồn tại không
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new Error('USER_NOT_FOUND');
  }

  // Nếu update email, kiểm tra xem email mới đã được dùng bởi người khác chưa
  if (data.email && data.email !== user.email) {
    const existingEmail = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existingEmail) {
      throw new Error('EMAIL_EXISTS');
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return updatedUser;
};

/**
 * Xóa user
 */
const deleteUser = async (id) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new Error('USER_NOT_FOUND');
  }

  await prisma.user.delete({
    where: { id },
  });

  return true;
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
