const { createRateLimiter } = require('../middlewares/rateLimiter');
const redis = require('../config/redis');
const { sendError } = require('../utils/response');

jest.mock('../config/redis', () => ({
  incrementCache: jest.fn(),
  expireCache: jest.fn(),
}));

jest.mock('../utils/response', () => ({
  sendError: jest.fn(),
}));

describe('Rate Limiter Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      user: { id: 'user-1' },
      headers: {},
      ip: '127.0.0.1'
    };
    res = {};
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should allow request if under limit and set TTL on first request', async () => {
    const middleware = createRateLimiter(5, 60);
    redis.incrementCache.mockResolvedValueOnce(1); // Lần 1
    
    await middleware(req, res, next);
    
    expect(redis.incrementCache).toHaveBeenCalledWith('rate_limit:user:user-1');
    expect(redis.expireCache).toHaveBeenCalledWith('rate_limit:user:user-1', 60);
    expect(next).toHaveBeenCalled();
  });

  it('should allow request if under limit but NOT set TTL on subsequent requests', async () => {
    const middleware = createRateLimiter(5, 60);
    redis.incrementCache.mockResolvedValueOnce(2); // Lần 2
    
    await middleware(req, res, next);
    
    expect(redis.incrementCache).toHaveBeenCalledWith('rate_limit:user:user-1');
    expect(redis.expireCache).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it('should return 429 if over limit', async () => {
    const middleware = createRateLimiter(5, 60);
    redis.incrementCache.mockResolvedValueOnce(6); // Lần 6
    
    await middleware(req, res, next);
    
    expect(redis.incrementCache).toHaveBeenCalledWith('rate_limit:user:user-1');
    expect(sendError).toHaveBeenCalledWith(res, {
      code: 429,
      message: 'Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau 60 giây.',
      errorCode: 'RATE_LIMIT_EXCEEDED',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should fallback to IP if user is not authenticated', async () => {
    req.user = undefined; // Chưa đăng nhập
    const middleware = createRateLimiter(5, 60);
    redis.incrementCache.mockResolvedValueOnce(1);
    
    await middleware(req, res, next);
    
    expect(redis.incrementCache).toHaveBeenCalledWith('rate_limit:ip:127.0.0.1');
    expect(next).toHaveBeenCalled();
  });

  it('should pass through if Redis fails (null returned)', async () => {
    const middleware = createRateLimiter(5, 60);
    redis.incrementCache.mockResolvedValueOnce(null); // Giả lập lỗi Redis
    
    await middleware(req, res, next);
    
    expect(next).toHaveBeenCalled();
    expect(sendError).not.toHaveBeenCalled();
  });
});
