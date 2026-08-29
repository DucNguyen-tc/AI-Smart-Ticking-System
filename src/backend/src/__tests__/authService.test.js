const authService = require('../services/authService');
const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { mockReset } = require('jest-mock-extended');

// Mock dependencies
jest.mock('../config/prisma', () => require('jest-mock-extended').mockDeep());
jest.mock('bcryptjs', () => ({
  genSalt: jest.fn(),
  hash: jest.fn(),
  compare: jest.fn()
}));
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn()
}));

describe('Auth Service', () => {
  beforeEach(() => {
    mockReset(prisma);
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test_secret';
  });

  describe('register', () => {
    it('should throw an error if email already exists', async () => {
      prisma.user.findUnique.mockResolvedValueOnce({ id: '1' }); // Email exists

      await expect(authService.register({
        email: 'test@example.com', password: 'password', name: 'Test'
      })).rejects.toMatchObject({
        code: 'EMAIL_ALREADY_EXISTS',
        statusCode: 409
      });
    });

    it('should create user if email does not exist', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(null); // Email does not exist
      
      bcrypt.genSalt.mockResolvedValueOnce('salt');
      bcrypt.hash.mockResolvedValueOnce('hashedPassword');
      
      const expectedUser = { id: '1', email: 'test@example.com', name: 'Test', role: 'CUSTOMER' };
      prisma.user.create.mockResolvedValueOnce(expectedUser);

      const result = await authService.register({
        email: 'test@example.com', password: 'password', name: 'Test'
      });

      expect(bcrypt.hash).toHaveBeenCalledWith('password', 'salt');
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'test@example.com',
          password: 'hashedPassword',
          name: 'Test',
          role: 'CUSTOMER'
        },
        select: expect.any(Object)
      });
      expect(result).toEqual(expectedUser);
    });
  });

  describe('login', () => {
    it('should throw error if user not found', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(null);

      await expect(authService.login({
        email: 'test@example.com', password: 'password'
      })).rejects.toMatchObject({
        code: 'INVALID_CREDENTIALS',
        statusCode: 401
      });
    });

    it('should throw error if password does not match', async () => {
      prisma.user.findUnique.mockResolvedValueOnce({
        id: '1', email: 'test@example.com', password: 'hashedPassword', role: 'CUSTOMER'
      });
      bcrypt.compare.mockResolvedValueOnce(false); // Wrong password

      await expect(authService.login({
        email: 'test@example.com', password: 'password'
      })).rejects.toMatchObject({
        code: 'INVALID_CREDENTIALS',
        statusCode: 401
      });
    });

    it('should return user without password and access token if valid', async () => {
      const dbUser = { id: '1', email: 'test@example.com', password: 'hashedPassword', role: 'CUSTOMER' };
      
      prisma.user.findUnique.mockResolvedValueOnce(dbUser);
      bcrypt.compare.mockResolvedValueOnce(true); // Correct password
      jwt.sign.mockReturnValueOnce('mock_jwt_token');

      const result = await authService.login({
        email: 'test@example.com', password: 'password'
      });

      expect(jwt.sign).toHaveBeenCalled();
      expect(result.accessToken).toBe('mock_jwt_token');
      expect(result.user).not.toHaveProperty('password');
      expect(result.user.email).toBe('test@example.com');
    });
  });
});
