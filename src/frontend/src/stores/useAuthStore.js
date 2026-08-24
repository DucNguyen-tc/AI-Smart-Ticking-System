import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,

      // Hành động Đăng nhập / Lưu token
      setAuth: (user, accessToken) => {
        set({ user, accessToken, isAuthenticated: true })
      },

      // Hành động Đăng xuất
      logout: () => {
        set({ user: null, accessToken: null, isAuthenticated: false })
      },
    }),
    {
      name: 'auth-storage', // Tên key trong localStorage
      storage: createJSONStorage(() => localStorage),
    }
  )
)
