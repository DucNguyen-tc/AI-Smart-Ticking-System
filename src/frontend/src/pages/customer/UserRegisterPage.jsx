import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Ticket, Loader2, UserPlus } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ThemeToggle } from '@/components/custom/ThemeToggle'

import { authService } from '@/services/authService'

export function UserRegisterPage() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: ''
  })

  const handleChange = (e) => {
    const { id, value } = e.target
    setFormData(prev => ({ ...prev, [id]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.fullName.trim() || !formData.email.trim() || !formData.password.trim()) {
      toast.error('Vui lòng điền đầy đủ thông tin.')
      return
    }

    if (formData.password.length < 6) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự.')
      return
    }

    setIsLoading(true)
    try {
      // Gọi API thật (lưu ý backend map 'name' với fullName)
      const response = await authService.register(formData.fullName, formData.email, formData.password)
      
      toast.success(response.message || 'Đăng ký thành công! Vui lòng đăng nhập.')
      navigate('/login')
    } catch (error) {
      toast.error(error.message || 'Đăng ký thất bại')
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

      <div className="flex-1 flex items-center justify-center p-4 py-8">
        <Card className="w-full max-w-sm border-border shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <UserPlus className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">Đăng ký tài khoản</CardTitle>
            <CardDescription>Tạo tài khoản để quản lý yêu cầu dễ dàng hơn</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Họ và Tên</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Nguyễn Văn A"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nhap@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mật khẩu</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">Ít nhất 6 ký tự</p>
              </div>
              <Button type="submit" className="w-full btn-lift mt-2" disabled={isLoading}>
                {isLoading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Đang đăng ký...</>
                ) : (
                  'Tạo tài khoản'
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center text-sm text-muted-foreground border-t border-border pt-4">
            Đã có tài khoản?{' '}
            <Link to="/login" className="text-primary hover:underline font-medium ml-1">
              Đăng nhập
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
