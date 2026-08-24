import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Ticket, Loader2, LogIn } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ThemeToggle } from '@/components/custom/ThemeToggle'

import { authService } from '@/services/authService'
import { useAuthStore } from '@/stores/useAuthStore'

export function UserLoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)
  
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      toast.error('Vui lòng điền đầy đủ email và mật khẩu.')
      return
    }
    
    setIsLoading(true)
    try {
      // Gọi API thật
      const response = await authService.login(email, password)
      
      // Axios interceptor đã trả về response.data { code, message, data: { user, accessToken } }
      const { user, accessToken } = response.data
      
      // Lưu vào Zustand
      setAuth(user, accessToken)
      
      toast.success(response.message || 'Đăng nhập thành công!')
      
      if (user.role === 'AGENT' || user.role === 'ADMIN') {
        navigate('/agent/dashboard')
      } else {
        navigate('/')
      }
    } catch (error) {
      toast.error(error.message || 'Đăng nhập thất bại')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background animate-page-in">
      <header className="flex items-center justify-between p-4 border-b border-border">
        <Link to="/" className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
          <Ticket className="w-5 h-5" />
          <span className="font-bold text-foreground">Smart Ticketing</span>
        </Link>
        <ThemeToggle />
      </header>

      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-sm border-border shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <LogIn className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">Đăng nhập</CardTitle>
            <CardDescription>Chào mừng bạn trở lại hệ thống hỗ trợ</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nhap@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Mật khẩu</Label>
                  <a href="#" className="text-xs text-primary hover:underline">Quên mật khẩu?</a>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full btn-lift" disabled={isLoading}>
                {isLoading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Đang đăng nhập...</>
                ) : (
                  'Đăng nhập'
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center text-sm text-muted-foreground border-t border-border pt-4">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="text-primary hover:underline font-medium ml-1">
              Đăng ký ngay
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
