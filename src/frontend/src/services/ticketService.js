import { apiClient } from './apiClient'

export const ticketService = {
  /**
   * Khởi tạo Ticket mới
   * @param {Object} data - { title, content, serviceType }
   */
  create: async (data) => {
    return apiClient.post('/tickets', data)
  },

  /**
   * Lấy danh sách Ticket (có phân trang)
   * @param {Object} params - { page, limit, status, serviceType, ... }
   */
  getAll: async (params = {}) => {
    return apiClient.get('/tickets', { params })
  },
  
  /**
   * Lấy chi tiết Ticket
   * @param {string} id - Ticket UUID
   */
  getById: async (id) => {
    return apiClient.get(`/tickets/${id}`)
  },

  /**
   * Phản hồi Ticket
   * @param {string} id - Ticket UUID
   * @param {Object} data - { message, isInternalNote }
   */
  reply: async (id, data) => {
    return apiClient.post(`/tickets/${id}/reply`, data)
  }
}
