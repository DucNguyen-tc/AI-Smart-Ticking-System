const faqService = require('../services/faqService');
const { sendSuccess, sendError } = require('../utils/response');

const create = async (req, res, next) => {
  try {
    const faq = await faqService.createFaq(req.body);
    return sendSuccess(res, {
      code: 201,
      message: 'Tạo FAQ thành công',
      data: faq,
    });
  } catch (error) {
    next(error);
  }
};

const getAll = async (req, res, next) => {
  try {
    const filters = {
      category: req.query.category,
    };
    
    const faqs = await faqService.getAllFaqs(filters);

    return sendSuccess(res, {
      message: 'Lấy danh sách FAQ thành công',
      data: faqs,
    });
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const faq = await faqService.getFaqById(id);

    return sendSuccess(res, {
      message: 'Lấy chi tiết FAQ thành công',
      data: faq,
    });
  } catch (error) {
    if (error.message === 'FAQ_NOT_FOUND') {
      return sendError(res, {
        code: 404,
        message: 'Không tìm thấy FAQ',
        errorCode: 'FAQ_NOT_FOUND',
      });
    }
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updatedFaq = await faqService.updateFaq(id, req.body);

    return sendSuccess(res, {
      message: 'Cập nhật FAQ thành công',
      data: updatedFaq,
    });
  } catch (error) {
    if (error.message === 'FAQ_NOT_FOUND') {
      return sendError(res, {
        code: 404,
        message: 'Không tìm thấy FAQ',
        errorCode: 'FAQ_NOT_FOUND',
      });
    }
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    await faqService.deleteFaq(id);

    return sendSuccess(res, {
      message: 'Xóa FAQ thành công',
      data: null,
    });
  } catch (error) {
    if (error.message === 'FAQ_NOT_FOUND') {
      return sendError(res, {
        code: 404,
        message: 'Không tìm thấy FAQ',
        errorCode: 'FAQ_NOT_FOUND',
      });
    }
    next(error);
  }
};

module.exports = {
  create,
  getAll,
  getById,
  update,
  remove,
};
