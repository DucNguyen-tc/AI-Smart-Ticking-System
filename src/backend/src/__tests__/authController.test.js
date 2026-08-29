const authController = require('../controllers/authController');
const authService = require('../services/authService');

// Mock authService
jest.mock('../services/authService', () => ({
  register: jest.fn(),
  login: jest.fn()
}));

describe('Auth Controller', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      body: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should return 409 if service throws EMAIL_ALREADY_EXISTS', async () => {
      mockReq.body = { email: 'test@example.com', password: 'password', name: 'Test' };
      
      const error = new Error('Email này đã được sử dụng');
      error.code = 'EMAIL_ALREADY_EXISTS';
      error.statusCode = 409;
      authService.register.mockRejectedValueOnce(error);

      await authController.register(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error_code: 'EMAIL_ALREADY_EXISTS'
      }));
    });

    it('should return 201 on success', async () => {
      mockReq.body = { email: 'test@example.com', password: 'password', name: 'Test' };
      const mockUser = { id: '1', email: 'test@example.com', name: 'Test' };
      authService.register.mockResolvedValueOnce(mockUser);

      await authController.register(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Đăng ký tài khoản thành công',
        data: { user: mockUser }
      }));
    });

    it('should call next(error) if service throws generic error', async () => {
      mockReq.body = { email: 'test@example.com', password: 'password', name: 'Test' };
      const error = new Error('Database down');
      authService.register.mockRejectedValueOnce(error);

      await authController.register(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('login', () => {
    it('should return 401 if service throws INVALID_CREDENTIALS', async () => {
      mockReq.body = { email: 'test@example.com', password: 'password' };
      
      const error = new Error('Email hoặc mật khẩu không đúng');
      error.code = 'INVALID_CREDENTIALS';
      error.statusCode = 401;
      authService.login.mockRejectedValueOnce(error);

      await authController.login(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error_code: 'INVALID_CREDENTIALS'
      }));
    });

    it('should return 200 on success', async () => {
      mockReq.body = { email: 'test@example.com', password: 'password' };
      const expectedResult = { user: { id: '1', email: 'test@example.com' }, accessToken: 'token' };
      
      authService.login.mockResolvedValueOnce(expectedResult);

      await authController.login(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expectedResult
      }));
    });

    it('should call next(error) if service throws generic error', async () => {
      mockReq.body = { email: 'test@example.com', password: 'password' };
      const error = new Error('Database down');
      authService.login.mockRejectedValueOnce(error);

      await authController.login(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
