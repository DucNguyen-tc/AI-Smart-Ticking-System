import axios from 'axios'
import { useAuthStore } from '@/stores/useAuthStore'

// Tạo instance axios với cấu hình mặc định
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor cho Request: Đính kèm Access Token vào header
apiClient.interceptors.request.use(
  (config) => {
    // Lấy token từ Zustand store
    const { accessToken } = useAuthStore.getState()
    
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Interceptor cho Response: Xử lý lỗi toàn cục
apiClient.interceptors.response.use(
  (response) => {
    // Backend chuẩn trả về { code, message, data } nên mình bóc luôn data ra
    return response.data
  },
  (error) => {
    // Xử lý lỗi từ server trả về
    if (error.response) {
      // Bắt lỗi 401 Unauthorized (Token hết hạn hoặc sai)
      if (error.response.status === 401) {
        useAuthStore.getState().logout()
        // Nếu cần có thể window.location.href = '/login'
      }
      
      // Throw lỗi kèm theo message từ backend (nếu có)
      const message = error.response.data?.message || 'Đã có lỗi xảy ra từ máy chủ.'
      return Promise.reject(new Error(message))
    }
    
    // Lỗi không có response (ví dụ: mất mạng, server down)
    return Promise.reject(new Error('Lỗi kết nối đến máy chủ. Vui lòng kiểm tra mạng.'))
  }
)
