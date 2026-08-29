const { sendSuccess, sendError } = require('../utils/response');

describe('Response Utility', () => {
  let mockRes;

  beforeEach(() => {
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  describe('sendSuccess', () => {
    it('should send success response with default parameters', () => {
      sendSuccess(mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        code: 200,
        message: 'Success',
        data: null,
        meta: null
      });
    });

    it('should send success response with custom parameters', () => {
      sendSuccess(mockRes, {
        code: 201,
        message: 'Created',
        data: { id: 1 },
        meta: { page: 1 }
      });

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        code: 201,
        message: 'Created',
        data: { id: 1 },
        meta: { page: 1 }
      });
    });
  });

  describe('sendError', () => {
    it('should send error response with default parameters', () => {
      sendError(mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        code: 400,
        message: 'Error',
        error_code: 'BAD_REQUEST',
        data: null
      });
    });

    it('should send error response with custom parameters', () => {
      sendError(mockRes, {
        code: 404,
        message: 'Not Found',
        errorCode: 'NOT_FOUND',
        data: { field: 'id' }
      });

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        code: 404,
        message: 'Not Found',
        error_code: 'NOT_FOUND',
        data: { field: 'id' }
      });
    });
  });
});
