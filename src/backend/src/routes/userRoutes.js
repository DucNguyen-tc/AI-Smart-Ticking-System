const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');
const { validateSchema } = require('../middlewares/validator');
const { createUserSchema, updateUserSchema } = require('../validators/userValidator');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

// Tất cả API của user đều cần phải đăng nhập
router.use(authenticate);

// POST /api/v1/users - Chỉ ADMIN được tạo
router.post(
  '/',
  authorize('ADMIN'),
  validateSchema(createUserSchema),
  userController.create
);

// GET /api/v1/users - Chỉ ADMIN được xem danh sách
router.get('/', authorize('ADMIN'), userController.getAll);

// GET /api/v1/users/:id - ADMIN hoặc user chủ sở hữu được xem (check logic trong controller)
router.get('/:id', userController.getById);

// PUT /api/v1/users/:id - ADMIN hoặc user chủ sở hữu được sửa (check logic trong controller)
router.put(
  '/:id',
  validateSchema(updateUserSchema),
  userController.update
);

// DELETE /api/v1/users/:id - Chỉ ADMIN được xóa
router.delete('/:id', authorize('ADMIN'), userController.remove);

module.exports = router;
