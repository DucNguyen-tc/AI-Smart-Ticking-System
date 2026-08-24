import React, { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ChevronLeft, Clock, MessageSquare, Bot, User, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

import { ticketService } from '@/services/ticketService'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'

const STATUS_CONFIG = {
  PENDING: { label: 'Chờ xử lý', color: 'bg-info/10 text-info', dot: 'bg-info', icon: Clock },
  PROCESSED: { label: 'Đang xử lý', color: 'bg-warning/10 text-warning', dot: 'bg-warning', icon: Bot },
  RESOLVED: { label: 'Đã giải quyết', color: 'bg-success/10 text-success', dot: 'bg-success', icon: CheckCircle2 },
  CLOSED: { label: 'Đóng', color: 'bg-muted text-muted-foreground', dot: 'bg-muted-foreground', icon: CheckCircle2 },
}

export function TicketDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const [ticket, setTicket] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadTicket() {
      try {
        const response = await ticketService.getById(id)
        setTicket(response.data)
      } catch (error) {
        toast.error(error.message)
        navigate('/track') // Quay lại nếu lỗi (vd 404)
      } finally {
        setIsLoading(false)
      }
    }
    loadTicket()
  }, [id, navigate])

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        <Skeleton className="w-32 h-10" />
        <Skeleton className="w-full h-48" />
        <Skeleton className="w-full h-64" />
      </div>
    )
  }

  if (!ticket) return null

  const status = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.PENDING
  const publicReplies = ticket.replies?.filter(r => !r.isInternalNote) || []

  const formatDate = (isoString) => {
    return new Date(isoString).toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl min-h-[calc(100vh-140px)]">
      <div className="mb-6 flex items-center justify-between">
        <Button variant="ghost" asChild className="pl-0 hover:bg-transparent hover:text-primary">
          <Link to="/track">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Quay lại Danh sách
          </Link>
        </Button>
        <div className="text-sm text-muted-foreground font-mono">
          #{ticket.id.split('-')[2] || ticket.id.substring(0, 8)}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Cột chính: Thông tin & Phản hồi */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border-border">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start gap-4 mb-2">
                <CardTitle className="text-xl leading-relaxed">{ticket.title}</CardTitle>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <Badge variant="outline">{ticket.serviceType}</Badge>
                <Badge variant="secondary" className={status.color}>
                  <div className={`w-1.5 h-1.5 rounded-full ${status.dot} mr-2`}></div>
                  {status.label}
                </Badge>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {formatDate(ticket.createdAt)}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/30 p-4 rounded-md text-sm leading-relaxed border border-border whitespace-pre-wrap">
                {ticket.content}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-4 border-b border-border mb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Phản hồi từ CSKH
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {publicReplies.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Chưa có phản hồi nào. Yêu cầu của bạn đang được xử lý.
                </div>
              ) : (
                publicReplies.map((reply) => (
                  <div key={reply.id} className="flex gap-4">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        {reply.sender?.role === 'AGENT' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                      </div>
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">
                          {reply.sender?.name || 'CSKH Team'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(reply.createdAt)}
                        </span>
                      </div>
                      <div className="text-sm bg-accent/40 border border-border p-3 rounded-md rounded-tl-none whitespace-pre-wrap">
                        {reply.message}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Cột phụ: Timeline */}
        <div className="space-y-6">
          <Card className="border-border sticky top-20">
            <CardHeader>
              <CardTitle className="text-base">Trạng thái xử lý</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative border-l-2 border-border ml-3 space-y-8">
                
                {/* Step 1: Created */}
                <div className="relative pl-6">
                  <div className="absolute w-3 h-3 bg-primary rounded-full -left-[7px] top-1.5 ring-4 ring-background"></div>
                  <div className="text-sm font-medium">Ticket được tạo</div>
                  <div className="text-xs text-muted-foreground mt-1">{formatDate(ticket.createdAt)}</div>
                </div>

                {/* Step 2: Analyzed / Processing */}
                <div className="relative pl-6">
                  <div className={`absolute w-3 h-3 rounded-full -left-[7px] top-1.5 ring-4 ring-background ${ticket.status === 'PENDING' ? 'bg-muted-foreground' : 'bg-warning'}`}></div>
                  <div className={`text-sm font-medium ${ticket.status === 'PENDING' ? 'text-muted-foreground' : ''}`}>AI đang phân tích</div>
                  {ticket.status !== 'PENDING' && (
                    <div className="text-xs text-muted-foreground mt-1">Hệ thống đã phân loại tự động</div>
                  )}
                </div>

                {/* Step 3: Resolved */}
                <div className="relative pl-6">
                  <div className={`absolute w-3 h-3 rounded-full -left-[7px] top-1.5 ring-4 ring-background ${ticket.status === 'RESOLVED' || ticket.status === 'CLOSED' ? 'bg-success' : 'bg-muted-foreground'}`}></div>
                  <div className={`text-sm font-medium ${ticket.status === 'RESOLVED' || ticket.status === 'CLOSED' ? '' : 'text-muted-foreground'}`}>CSKH đã phản hồi</div>
                </div>

              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}
