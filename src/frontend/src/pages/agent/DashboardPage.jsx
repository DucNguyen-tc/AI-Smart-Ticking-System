import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Clock, Cog, CheckCircle2, Search } from 'lucide-react'
import { toast } from 'sonner'

import { ticketService } from '@/services/ticketService'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'
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

const SENTIMENT_EMOJI = { ANGRY: '😡', FRUSTRATED: '😤', NEUTRAL: '😐', SATISFIED: '😊' }

const ITEMS_PER_PAGE = 8

function relativeTime(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Vừa xong'
  if (mins < 60) return `${mins} phút trước`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} giờ trước`
  const days = Math.floor(hours / 24)
  return `${days} ngày trước`
}

export function DashboardPage() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [tickets, setTickets] = useState([])
  const [stats, setStats] = useState({ urgent: 0, pending: 0, processed: 0, resolved: 0 })
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Filters
  const [filterPriority, setFilterPriority] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterSentiment, setFilterSentiment] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const loadTickets = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = {
        page: currentPage,
        limit: ITEMS_PER_PAGE,
      }
      if (filterPriority) params.priority = filterPriority
      if (filterStatus) params.status = filterStatus
      if (filterSentiment) params.sentiment = filterSentiment
      if (searchQuery) params.search = searchQuery

      const res = await ticketService.getAll(params)
      setTickets(res.data || [])
      setTotalPages(res.meta?.totalPages || 1)
      if (res.stats) {
        setStats(res.stats)
      }
    } catch (err) {
      toast.error(err.message || 'Lỗi khi tải danh sách ticket')
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, filterPriority, filterStatus, filterSentiment, searchQuery])

  useEffect(() => {
    loadTickets()
  }, [loadTickets])

  const handleStatClick = (key) => {
    setCurrentPage(1)
    if (key === 'urgent') {
      setFilterPriority(filterPriority === 'URGENT' ? '' : 'URGENT')
      setFilterStatus('')
    } else {
      const statusMap = { pending: 'PENDING', processed: 'PROCESSED', resolved: 'RESOLVED' }
      setFilterStatus(filterStatus === statusMap[key] ? '' : statusMap[key])
      setFilterPriority('')
    }
  }

  const clearFilters = () => {
    setFilterPriority('')
    setFilterStatus('')
    setFilterSentiment('')
    setSearchQuery('')
    setCurrentPage(1)
  }

  const statCards = [
    { key: 'urgent',    icon: AlertTriangle, value: stats.urgent,    label: 'URGENT',    color: 'text-danger',  bg: 'bg-danger/10',  ring: filterPriority === 'URGENT' },
    { key: 'pending',   icon: Clock,         value: stats.pending,   label: 'PENDING',   color: 'text-info',    bg: 'bg-info/10',    ring: filterStatus === 'PENDING' },
    { key: 'processed', icon: Cog,           value: stats.processed, label: 'PROCESSED', color: 'text-warning', bg: 'bg-warning/10', ring: filterStatus === 'PROCESSED' },
    { key: 'resolved',  icon: CheckCircle2,  value: stats.resolved,  label: 'RESOLVED',  color: 'text-success', bg: 'bg-success/10', ring: filterStatus === 'RESOLVED' },
  ]

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard CSKH</h1>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((sc) => {
          const Icon = sc.icon
          return (
            <Card
              key={sc.key}
              className={cn(
                "cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-md border-border",
                sc.ring && "ring-2 ring-primary"
              )}
              onClick={() => handleStatClick(sc.key)}
            >
              <CardContent className="p-4 flex items-center gap-4">
                <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", sc.bg)}>
                  <Icon className={cn("w-6 h-6", sc.color)} />
                </div>
                <div>
                  <div className={cn("text-2xl font-bold", sc.color)}>
                    {isLoading ? <Skeleton className="h-7 w-10" /> : sc.value}
                  </div>
                  <div className="text-xs text-muted-foreground font-medium">{sc.label}</div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Filter Bar + Table */}
      <Card className="border-border overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/30">
          <div className="flex flex-col md:flex-row gap-3">
            <Select value={filterPriority} onValueChange={(v) => { setFilterPriority(v === 'ALL' ? '' : v); setCurrentPage(1) }}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả Priority</SelectItem>
                <SelectItem value="URGENT">🔴 Urgent</SelectItem>
                <SelectItem value="HIGH">🟡 High</SelectItem>
                <SelectItem value="MEDIUM">🔵 Medium</SelectItem>
                <SelectItem value="LOW">🟢 Low</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v === 'ALL' ? '' : v); setCurrentPage(1) }}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="PROCESSED">Processed</SelectItem>
                <SelectItem value="RESOLVED">Resolved</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterSentiment} onValueChange={(v) => { setFilterSentiment(v === 'ALL' ? '' : v); setCurrentPage(1) }}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="Sentiment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả Sentiment</SelectItem>
                <SelectItem value="ANGRY">😡 Angry</SelectItem>
                <SelectItem value="FRUSTRATED">😤 Frustrated</SelectItem>
                <SelectItem value="NEUTRAL">😐 Neutral</SelectItem>
                <SelectItem value="SATISFIED">😊 Satisfied</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo tiêu đề, tên KH..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1) }}
                className="pl-9"
              />
            </div>

            {(filterPriority || filterStatus || filterSentiment || searchQuery) && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
                ✕ Xóa bộ lọc
              </Button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            Không tìm thấy ticket nào phù hợp với bộ lọc hiện tại.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[110px]">Priority</TableHead>
                  <TableHead>Tiêu đề</TableHead>
                  <TableHead className="hidden md:table-cell">Khách hàng</TableHead>
                  <TableHead className="w-[100px]">Sentiment</TableHead>
                  <TableHead className="w-[130px]">Trạng thái</TableHead>
                  <TableHead className="w-[110px] hidden sm:table-cell">Thời gian</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket) => {
                  const ticketPriority = ticket.aiAnalysis?.priority || 'LOW'
                  const ticketSentiment = ticket.aiAnalysis?.sentiment || 'NEUTRAL'
                  
                  const status = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.PENDING
                  const priority = PRIORITY_CONFIG[ticketPriority] || PRIORITY_CONFIG.MEDIUM

                  return (
                    <TableRow
                      key={ticket.id}
                      className={cn(
                        "cursor-pointer transition-colors",
                        ticketPriority === 'URGENT' && "bg-danger/[0.03] hover:bg-danger/[0.07]",
                        ticketPriority !== 'URGENT' && "hover:bg-muted/50"
                      )}
                      onClick={() => navigate(`/agent/tickets/${ticket.id}`)}
                    >
                      <TableCell>
                        <Badge variant="outline" className={cn("font-medium", priority.color, ticketPriority === 'URGENT' && 'animate-pulse-subtle')}>
                          {priority.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium line-clamp-1">{ticket.title}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{ticket.serviceType}</div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="text-sm">{ticket.user?.name || 'Chưa rõ'}</div>
                        <div className="text-xs text-muted-foreground">{ticket.user?.email || ''}</div>
                      </TableCell>
                      <TableCell>
                        <span className="text-lg" title={ticketSentiment}>
                          {SENTIMENT_EMOJI[ticketSentiment] || '😐'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={status.color}>
                          <div className={cn("w-1.5 h-1.5 rounded-full mr-1.5", status.dot)} />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                        {relativeTime(ticket.createdAt)}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }).map((_, i) => (
              <PaginationItem key={i}>
                <PaginationLink
                  isActive={currentPage === i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  className="cursor-pointer"
                >
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
}
