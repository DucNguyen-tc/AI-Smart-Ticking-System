import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ChevronLeft, Copy, PenLine, Send, Loader2, User, Bot, Clock, Eye, EyeOff, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'

import { ticketService } from '@/services/ticketService'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

const STATUS_CONFIG = {
  PENDING:   { label: 'Chờ xử lý',     color: 'bg-info/10 text-info',       dot: 'bg-info' },
  PROCESSED: { label: 'Đang xử lý',    color: 'bg-warning/10 text-warning', dot: 'bg-warning' },
  RESOLVED:  { label: 'Đã giải quyết', color: 'bg-success/10 text-success', dot: 'bg-success' },
  CLOSED:    { label: 'Đã đóng',       color: 'bg-muted text-muted-foreground', dot: 'bg-muted-foreground' },
}

const PRIORITY_CONFIG = {
  URGENT: { label: 'Khẩn cấp',    color: 'text-danger border-danger/40 bg-danger/5' },
  HIGH:   { label: 'Cao',         color: 'text-warning border-warning/40 bg-warning/5' },
  MEDIUM: { label: 'Trung bình',  color: 'text-info border-info/40 bg-info/5' },
  LOW:    { label: 'Thấp',        color: 'text-muted-foreground border-border' },
}

const SENTIMENT_CONFIG = {
  ANGRY: { label: 'Tức giận', emoji: '😡' },
  NEUTRAL: { label: 'Bình thường', emoji: '😐' },
  POSITIVE: { label: 'Hài lòng', emoji: '😊' }
}

function formatDate(isoString) {
  return new Date(isoString).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

export function AgentTicketDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const replyRef = useRef(null)

  const [ticket, setTicket] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [replyContent, setReplyContent] = useState('')
  const [isInternalNote, setIsInternalNote] = useState(false)
  const [isSending, setIsSending] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const response = await ticketService.getById(id)
        setTicket(response.data)
      } catch (err) {
        toast.error(err.message)
        navigate('/agent/dashboard')
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [id, navigate])

  const handleCopySuggested = () => {
    if (ticket?.aiAnalysis?.suggestedReply) {
      navigator.clipboard.writeText(ticket.aiAnalysis.suggestedReply)
      toast.success('Đã sao chép câu trả lời gợi ý!')
    }
  }

  const handleUseDraft = () => {
    if (ticket?.aiAnalysis?.suggestedReply) {
      setReplyContent(ticket.aiAnalysis.suggestedReply)
      replyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      toast.info('Đã paste nội dung AI vào ô phản hồi.')
    }
  }

  const handleSendReply = async () => {
    if (!replyContent.trim()) {
      toast.error('Vui lòng nhập nội dung phản hồi.')
      return
    }
    setIsSending(true)
    try {
      await ticketService.reply(id, {
        message: replyContent,
        isInternalNote: isInternalNote
      })
      toast.success(isInternalNote ? 'Đã lưu ghi chú nội bộ!' : 'Đã gửi phản hồi cho khách hàng!')
      navigate('/agent/dashboard')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setIsSending(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <Skeleton className="lg:col-span-3 h-80" />
          <Skeleton className="lg:col-span-2 h-80" />
        </div>
        <Skeleton className="h-48" />
      </div>
    )
  }

  if (!ticket) return null

  const ai = ticket.aiAnalysis || {}
  const status = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.PENDING
  const priority = PRIORITY_CONFIG[ai.priority] || PRIORITY_CONFIG.MEDIUM
  const sentiment = SENTIMENT_CONFIG[ai.sentiment] || { label: 'Chưa có', emoji: '😐' }
  const allReplies = ticket.replies || []
  const confidencePct = Math.round((ai.confidenceScore || 0) * 100)

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild className="hover:bg-transparent hover:text-primary pl-0">
            <Link to="/agent/dashboard">
              <ChevronLeft className="w-4 h-4 mr-1" />
              Quay lại
            </Link>
          </Button>
          <span className="text-muted-foreground font-mono text-sm">Ticket #{id.split('-').pop()}</span>
        </div>
        <Badge variant="secondary" className={cn(status.color, "text-sm")}>
          <div className={cn("w-2 h-2 rounded-full mr-2", status.dot)} />
          {status.label}
        </Badge>
      </div>

      {/* 2-Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Panel trái: Nội dung Ticket (60%) */}
        <Card className="lg:col-span-3 border-border">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                  {(ticket.user?.name || 'KH').substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">{ticket.user?.name || 'Khách hàng'}</div>
                <div className="text-xs text-muted-foreground">{ticket.user?.email || 'N/A'}</div>
              </div>
              <Badge variant="outline" className="ml-auto">{ticket.serviceType}</Badge>
            </div>
            <CardTitle className="text-xl leading-relaxed">{ticket.title}</CardTitle>
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              {formatDate(ticket.createdAt)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/40 p-4 rounded-lg text-sm leading-relaxed whitespace-pre-wrap border border-border">
              {ticket.content}
            </div>
          </CardContent>
        </Card>

        {/* Panel phải: AI Analysis (40%) */}
        <Card className="lg:col-span-2 border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary" />
              AI Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Cảm xúc</span>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{sentiment.emoji}</span>
                  <Badge variant="outline" className="text-xs">{sentiment.label}</Badge>
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Ưu tiên</span>
                <div>
                  <Badge variant="outline" className={cn("text-xs", priority.color)}>
                    {priority.label}
                  </Badge>
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Phân loại</span>
                <div>
                  <Badge variant="outline" className="text-xs">{ai.category || 'N/A'}</Badge>
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Độ tin cậy</span>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${confidencePct}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono font-medium">{confidencePct}%</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* AI Summary */}
            <div>
              <h4 className="text-sm font-medium mb-2">📝 Tóm tắt AI</h4>
              <p className="text-sm text-muted-foreground italic bg-muted/40 p-3 rounded-md border border-border">
                {ai.summary || 'Chưa có dữ liệu phân tích.'}
              </p>
            </div>

            {/* Suggested Reply */}
            <div>
              <h4 className="text-sm font-medium mb-2">✍️ Câu trả lời gợi ý</h4>
              <div className="bg-primary/5 border-2 border-primary/20 rounded-lg p-3 text-sm whitespace-pre-wrap">
                {ai.suggestedReply || 'Chưa có gợi ý.'}
              </div>
              <div className="flex gap-2 mt-3">
                <Button variant="outline" size="sm" onClick={handleCopySuggested}>
                  <Copy className="w-3.5 h-3.5 mr-1.5" />
                  Sao chép
                </Button>
                <Button variant="default" size="sm" onClick={handleUseDraft}>
                  <PenLine className="w-3.5 h-3.5 mr-1.5" />
                  Dùng làm bản nháp
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Form Gửi Phản hồi */}
      <Card className="border-border" ref={replyRef}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Send className="w-5 h-5" />
            Gửi Phản hồi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Nhập nội dung phản hồi cho khách hàng..."
            className="min-h-[120px] resize-y"
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
          />
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="internal-note"
                checked={isInternalNote}
                onCheckedChange={(checked) => setIsInternalNote(!!checked)}
              />
              <Label htmlFor="internal-note" className="text-sm text-muted-foreground cursor-pointer flex items-center gap-1.5">
                {isInternalNote ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                Ghi chú nội bộ (không gửi cho khách)
              </Label>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => navigate('/agent/dashboard')}>Hủy bỏ</Button>
              <Button onClick={handleSendReply} disabled={isSending}>
                {isSending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Đang gửi...</>
                ) : (
                  <><Send className="w-4 h-4 mr-2" />Gửi Phản hồi</>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lịch sử Trao đổi */}
      {allReplies.length > 0 && (
        <Card className="border-border">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Lịch sử Trao đổi
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {allReplies.map((reply) => (
              <div
                key={reply.id}
                className={cn(
                  "flex gap-3",
                  reply.isInternalNote && "opacity-70"
                )}
              >
                <Avatar className="h-8 w-8 flex-shrink-0 mt-0.5">
                  <AvatarFallback className={cn(
                    "text-xs font-bold",
                    (reply.sender?.role === 'AGENT' || reply.sender?.role === 'ADMIN') ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  )}>
                    {(reply.sender?.role === 'AGENT' || reply.sender?.role === 'ADMIN') ? <User className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">{reply.sender?.name || 'User'}</span>
                    <span className="text-xs text-muted-foreground">{formatDate(reply.createdAt)}</span>
                    {reply.isInternalNote && (
                      <Badge variant="outline" className="text-xs bg-warning/10 text-warning border-warning/30">
                        <EyeOff className="w-3 h-3 mr-1" />
                        Nội bộ
                      </Badge>
                    )}
                  </div>
                  <div className={cn(
                    "text-sm p-3 rounded-lg border whitespace-pre-wrap",
                    reply.isInternalNote
                      ? "bg-warning/5 border-warning/20"
                      : "bg-accent/40 border-border rounded-tl-none"
                  )}>
                    {reply.message}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
