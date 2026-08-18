const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateSchema } = require('../middlewares/validator');
const { registerSchema, loginSchema } = require('../validators/authValidator');

// Đăng ký tài khoản (Dành cho Khách hàng)
router.post('/register', validateSchema(registerSchema), authController.register);

// Đăng nhập
router.post('/login', validateSchema(loginSchema), authController.login);

module.exports = router;
