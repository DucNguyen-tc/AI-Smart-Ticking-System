import { apiClient } from './apiClient'

export const authService = {
  /**
   * Gọi API đăng nhập
   * @param {string} email
   * @param {string} password
   */
  login: async (email, password) => {
    return apiClient.post('/auth/login', { email, password })
  },

  /**
   * Gọi API đăng ký
   * @param {string} name
   * @param {string} email
   * @param {string} password
   */
  register: async (name, email, password) => {
    return apiClient.post('/auth/register', { name, email, password })
  }
}
