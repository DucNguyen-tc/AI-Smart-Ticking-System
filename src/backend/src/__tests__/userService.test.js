const userService = require('../services/userService');
const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');
const { mockDeep, mockReset } = require('jest-mock-extended');

// Mock dependencies
jest.mock('../config/prisma', () => require('jest-mock-extended').mockDeep());
jest.mock('bcryptjs', () => ({
  genSalt: jest.fn(),
  hash: jest.fn(),
}));

describe('User Service', () => {
  beforeEach(() => {
    mockReset(prisma);
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should throw an error if email already exists', async () => {
      prisma.user.findUnique.mockResolvedValueOnce({ id: '1' }); // Email exists

      await expect(
        userService.createUser({
          email: 'test@example.com',
          password: 'password',
          name: 'Test',
        })
      ).rejects.toThrow('EMAIL_EXISTS');
    });

    it('should create user successfully', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(null); // Email doesn't exist

      bcrypt.genSalt.mockResolvedValueOnce('salt');
      bcrypt.hash.mockResolvedValueOnce('hashedPassword');

      const expectedUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test',
        role: 'CUSTOMER',
      };
      prisma.user.create.mockResolvedValueOnce(expectedUser);

      const result = await userService.createUser({
        email: 'test@example.com',
        password: 'password',
        name: 'Test',
      });

      expect(bcrypt.hash).toHaveBeenCalledWith('password', 'salt');
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'test@example.com',
          password: 'hashedPassword',
          name: 'Test',
        },
        select: expect.any(Object),
      });
      expect(result).toEqual(expectedUser);
    });
  });

  describe('getAllUsers', () => {
    it('should return paginated users and total count', async () => {
      const usersList = [
        { id: '1', email: 'test1@example.com', name: 'Test1' },
        { id: '2', email: 'test2@example.com', name: 'Test2' },
      ];
      prisma.user.findMany.mockResolvedValueOnce(usersList);
      prisma.user.count.mockResolvedValueOnce(2);

      const result = await userService.getAllUsers(1, 10);

      expect(prisma.user.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: expect.any(Object),
      });
      expect(result).toEqual({ users: usersList, total: 2 });
    });
  });

  describe('getUserById', () => {
    it('should return user without password', async () => {
      const mockUser = { id: '1', email: 'test@example.com', name: 'Test' };
      prisma.user.findUnique.mockResolvedValueOnce(mockUser);

      const result = await userService.getUserById('1');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        select: expect.any(Object),
      });
      expect(result).toEqual(mockUser);
    });
  });

  describe('updateUser', () => {
    it('should throw an error if user not found', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(null);

      await expect(userService.updateUser('1', { name: 'New Name' })).rejects.toThrow('USER_NOT_FOUND');
    });

    it('should update user successfully', async () => {
      const existingUser = { id: '1', email: 'old@example.com', name: 'Old' };
      prisma.user.findUnique.mockResolvedValueOnce(existingUser); // checks user existence

      const updatedUser = { id: '1', email: 'old@example.com', name: 'New Name' };
      prisma.user.update.mockResolvedValueOnce(updatedUser);

      const result = await userService.updateUser('1', { name: 'New Name' });

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { name: 'New Name' },
        select: expect.any(Object),
      });
      expect(result).toEqual(updatedUser);
    });
  });

  describe('deleteUser', () => {
    it('should throw an error if user not found', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(null);

      await expect(userService.deleteUser('1')).rejects.toThrow('USER_NOT_FOUND');
    });

    it('should delete user successfully', async () => {
      prisma.user.findUnique.mockResolvedValueOnce({ id: '1' });
      prisma.user.delete.mockResolvedValueOnce({ id: '1' });

      const result = await userService.deleteUser('1');

      expect(prisma.user.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(result).toBe(true);
    });
  });
});
