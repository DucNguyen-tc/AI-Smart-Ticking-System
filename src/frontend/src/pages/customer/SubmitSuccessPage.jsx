import React, { useEffect } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { CheckCircle2, Copy, Search, Home } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function SubmitSuccessPage() {
  const location = useLocation()
  const navigate = useNavigate()
  
  const ticketId = location.state?.ticket_id

  useEffect(() => {
    // If there is no ticket ID in state, it means user navigated directly to this URL.
    if (!ticketId) {
      navigate('/submit-ticket', { replace: true })
    }
  }, [ticketId, navigate])

  if (!ticketId) return null

  const handleCopy = () => {
    navigator.clipboard.writeText(ticketId)
    toast.success("Đã sao chép mã Ticket vào bộ nhớ tạm.")
  }

  const currentDate = new Date().toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric', 
    hour: '2-digit', minute: '2-digit'
  })

  return (
    <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[calc(100vh-140px)]">
      <Card className="w-full max-w-lg border-border text-center overflow-hidden">
        <CardContent className="pt-12 pb-8 px-6">
          <div className="flex justify-center mb-6">
            <CheckCircle2 className="w-20 h-20 text-success animate-in zoom-in duration-500" />
          </div>
          
          <h2 className="text-3xl font-bold text-foreground mb-4">Đã ghi nhận!</h2>
          <p className="text-muted-foreground mb-8 text-base px-4">
            Yêu cầu của bạn đang được AI phân tích.<br/>
            Nhân viên CSKH sẽ phản hồi trong thời gian sớm nhất.
          </p>
          
          <div className="bg-muted/50 rounded-xl p-6 text-left mb-8 border border-border">
            <div className="mb-4">
              <span className="text-sm text-muted-foreground block mb-1">Mã Ticket:</span>
              <div className="flex items-center gap-2">
                <code className="bg-background px-3 py-2 rounded-md font-mono text-sm flex-1 border truncate">
                  {ticketId}
                </code>
                <Button variant="outline" size="icon" onClick={handleCopy} title="Copy">
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground block mb-1">Trạng thái:</span>
                <Badge variant="secondary" className="bg-info/10 text-info hover:bg-info/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-info mr-2"></div>
                  PENDING
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground block mb-1">Thời gian:</span>
                <span className="font-medium text-foreground">{currentDate}</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link to="/track">
                <Search className="w-4 h-4 mr-2" />
                Tra cứu Ticket
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
              <Link to="/">
                <Home className="w-4 h-4 mr-2" />
                Về Trang chủ
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
