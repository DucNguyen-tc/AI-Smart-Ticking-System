const express = require('express');
const router = express.Router();

const ticketController = require('../controllers/ticketController');
const { validateSchema } = require('../middlewares/validator');
const { createTicketSchema, updateTicketSchema, replyTicketSchema } = require('../validators/ticketValidator');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

const { createRateLimiter } = require('../middlewares/rateLimiter');

// Tất cả API Ticket yêu cầu đăng nhập
router.use(authenticate);

// POST /api/v1/tickets - CUSTOMER, AGENT, ADMIN đều được tạo (mặc định gán userId theo actor)
// Giới hạn 5 requests / 60 giây
router.post(
  '/',
  createRateLimiter(5, 60),
  validateSchema(createTicketSchema),
  ticketController.create
);

// GET /api/v1/tickets - Phân quyền lấy theo actor bên trong service
router.get('/', ticketController.getAll);

// GET /api/v1/tickets/:id - Phân quyền lấy theo actor bên trong service
router.get('/:id', ticketController.getById);

// PUT /api/v1/tickets/:id - Phân quyền lấy theo actor bên trong service
router.put(
  '/:id',
  validateSchema(updateTicketSchema),
  ticketController.update
);

// POST /api/v1/tickets/:id/reply - Chỉ AGENT/ADMIN được phản hồi
router.post(
  '/:id/reply',
  authorize('AGENT', 'ADMIN'),
  validateSchema(replyTicketSchema),
  ticketController.reply
);

// DELETE /api/v1/tickets/:id - Chỉ ADMIN được xóa
router.delete('/:id', authorize('ADMIN'), ticketController.remove);

module.exports = router;
