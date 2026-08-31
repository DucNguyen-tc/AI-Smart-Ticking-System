/**
 * Gửi response thành công (Success Response) theo chuẩn API_SPECIFICATION.md
 * 
 * Định dạng:
 * {
 *   "success": true,
 *   "code": 200,
 *   "message": "Mô tả ngắn gọn kết quả",
 *   "data": {},
 *   "meta": null
 * }
 * 
 * @param {Object} res - Express Response Object
 * @param {Object} options - Các thuộc tính cấu hình response
 * @param {number} options.code - HTTP Status Code (default: 200)
 * @param {string} options.message - Tin nhắn mô tả kết quả
 * @param {any} options.data - Dữ liệu trả về (object hoặc array, default: null)
 * @param {Object|null} options.meta - Thông tin bổ sung như phân trang (default: null)
 */
const sendSuccess = (res, { code = 200, message = 'Success', data = null, meta = null, ...rest } = {}) => {
  return res.status(code).json({
    success: true,
    code,
    message,
    data,
    meta,
    ...rest
  });
};

/**
 * Gửi response lỗi (Error Response) theo chuẩn API_SPECIFICATION.md
 * 
 * Định dạng:
 * {
 *   "success": false,
 *   "code": 400,
 *   "message": "Nội dung ticket không được để trống",
 *   "error_code": "INVALID_INPUT",
 *   "data": null
 * }
 * 
 * @param {Object} res - Express Response Object
 * @param {Object} options - Các thuộc tính cấu hình response
 * @param {number} options.code - HTTP Status Code (default: 400)
 * @param {string} options.message - Tin nhắn thông báo lỗi
 * @param {string} options.errorCode - Mã lỗi nghiệp vụ (default: 'BAD_REQUEST')
 * @param {any} options.data - Dữ liệu bổ sung đi kèm lỗi (default: null)
 */
const sendError = (res, { code = 400, message = 'Error', errorCode = 'BAD_REQUEST', data = null } = {}) => {
  return res.status(code).json({
    success: false,
    code,
    message,
    error_code: errorCode,
    data
  });
};

module.exports = {
  sendSuccess,
  sendError
};
