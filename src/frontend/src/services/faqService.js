import { apiClient } from './apiClient'

export const faqService = {
  /**
   * Gọi API lấy danh sách FAQ
   * @param {string} category - Lọc theo category (optional)
   */
  getAll: async (category = '') => {
    const params = category ? { category } : {}
    return apiClient.get('/faqs', { params })
  },
  
  create: async (data) => {
    return apiClient.post('/faqs', data)
  },
  
  update: async (id, data) => {
    return apiClient.put(`/faqs/${id}`, data)
  },
  
  remove: async (id) => {
    return apiClient.delete(`/faqs/${id}`)
  }
}
