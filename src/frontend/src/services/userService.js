import { apiClient } from './apiClient'

export const userService = {
  getAll: async (page = 1, limit = 10) => {
    return apiClient.get('/users', { params: { page, limit } })
  },
  
  getById: async (id) => {
    return apiClient.get(`/users/${id}`)
  },
  
  create: async (data) => {
    return apiClient.post('/users', data)
  },
  
  update: async (id, data) => {
    return apiClient.put(`/users/${id}`, data)
  },
  
  remove: async (id) => {
    return apiClient.delete(`/users/${id}`)
  }
}
