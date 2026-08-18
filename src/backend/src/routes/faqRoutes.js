const express = require('express');
const router = express.Router();
const faqController = require('../controllers/faqController');
const { validateSchema } = require('../middlewares/validator');
const { faqSchema, updateFaqSchema } = require('../validators/faqValidator');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

// Các route có thể truy cập nếu đã đăng nhập (Bất kỳ role nào)
router.get('/', authenticate, faqController.getAll);
router.get('/:id', authenticate, faqController.getById);

// Các route chỉ dành cho ADMIN
router.use(authenticate, authorize('ADMIN'));

router.post('/', validateSchema(faqSchema), faqController.create);
router.put('/:id', validateSchema(updateFaqSchema), faqController.update);
router.delete('/:id', faqController.remove);

module.exports = router;
