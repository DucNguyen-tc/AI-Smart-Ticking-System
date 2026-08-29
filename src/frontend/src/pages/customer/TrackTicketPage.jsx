import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Ticket as TicketIcon } from 'lucide-react'
import { toast } from 'sonner'
import { ticketService } from '@/services/ticketService'
import { useAuthStore } from '@/stores/useAuthStore'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'
import { EmptyState } from '@/components/custom/EmptyState'

const STATUS_CONFIG = {
  PENDING: { label: 'Chờ xử lý', color: 'bg-info/10 text-info hover:bg-info/20', dot: 'bg-info' },
  PROCESSED: { label: 'Đang xử lý', color: 'bg-warning/10 text-warning hover:bg-warning/20', dot: 'bg-warning' },
  RESOLVED: { label: 'Đã giải quyết', color: 'bg-success/10 text-success hover:bg-success/20', dot: 'bg-success' },
  CLOSED: { label: 'Đóng', color: 'bg-muted text-muted-foreground hover:bg-muted', dot: 'bg-muted-foreground' },
}

const PRIORITY_CONFIG = {
  URGENT: { label: 'Khẩn cấp', color: 'text-danger border-danger/30' },
  HIGH: { label: 'Cao', color: 'text-warning border-warning/30' },
  MEDIUM: { label: 'Trung bình', color: 'text-neutral border-neutral/30' },
  LOW: { label: 'Thấp', color: 'text-muted-foreground border-border' },
}

const ITEMS_PER_PAGE = 5

export function TrackTicketPage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const [isLoading, setIsLoading] = useState(true)
  const [tickets, setTickets] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  const [statusFilter, setStatusFilter] = useState('ALL')
  const [serviceTypeFilter, setServiceTypeFilter] = useState('ALL')

  React.useEffect(() => {
    if (!isAuthenticated) {
      toast.info("Vui lòng đăng nhập để tra cứu yêu cầu hỗ trợ.")
      navigate('/login')
    }
  }, [isAuthenticated, navigate])

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter, serviceTypeFilter])

  const fetchTickets = React.useCallback(async () => {
    if (!isAuthenticated) return

    setIsLoading(true)
    try {
      const params = { page: currentPage, limit: ITEMS_PER_PAGE }
      if (statusFilter !== 'ALL') params.status = statusFilter
      if (serviceTypeFilter !== 'ALL') params.serviceType = serviceTypeFilter

      const response = await ticketService.getAll(params)
      setTickets(response.data || [])
      setTotalPages(response.meta?.totalPages || 1)
      setTotalItems(response.meta?.total || 0)
    } catch (error) {
      toast.error(error.message || "Lỗi khi lấy danh sách ticket")
      setTickets([])
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, isAuthenticated, statusFilter, serviceTypeFilter])

  React.useEffect(() => {
    fetchTickets()
  }, [fetchTickets])

  const handleRowClick = (id) => {
    navigate(`/track/${id}`)
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl min-h-[calc(100vh-140px)]">
      
      <Card className="mb-8 border-border">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Lịch sử Yêu cầu Hỗ trợ</CardTitle>
          <CardDescription>Danh sách các ticket bạn đã gửi đến hệ thống.</CardDescription>
        </CardHeader>
      </Card>

      {/* Filters row */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="w-full sm:w-[200px] space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Trạng thái</label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="bg-background border-border">
              <SelectValue placeholder="Chọn trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
              <SelectItem value="PENDING">Chờ xử lý</SelectItem>
              <SelectItem value="PROCESSED">Đang xử lý</SelectItem>
              <SelectItem value="RESOLVED">Đã giải quyết</SelectItem>
              <SelectItem value="CLOSED">Đã đóng</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-full sm:w-[200px] space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Loại dịch vụ</label>
          <Select value={serviceTypeFilter} onValueChange={setServiceTypeFilter}>
            <SelectTrigger className="bg-background border-border">
              <SelectValue placeholder="Chọn dịch vụ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả dịch vụ</SelectItem>
              <SelectItem value="ECOMMERCE">E-Commerce</SelectItem>
              <SelectItem value="SOFTWARE">Software</SelectItem>
              <SelectItem value="PAYMENT">Payment</SelectItem>
              <SelectItem value="GENERAL">General</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <Card className="border-border">
          <CardContent className="p-0">
            <div className="space-y-4 p-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </CardContent>
        </Card>
      ) : tickets.length === 0 ? (
        <EmptyState 
          icon={TicketIcon}
          title="Không tìm thấy ticket nào"
          description={
            statusFilter !== 'ALL' || serviceTypeFilter !== 'ALL'
              ? "Không có yêu cầu hỗ trợ nào khớp với bộ lọc của bạn."
              : "Bạn chưa gửi yêu cầu hỗ trợ nào."
          }
          action={
            statusFilter !== 'ALL' || serviceTypeFilter !== 'ALL' ? (
              <Button variant="outline" onClick={() => { setStatusFilter('ALL'); setServiceTypeFilter('ALL') }}>
                Xóa bộ lọc
              </Button>
            ) : (
              <Button onClick={() => navigate('/submit-ticket')}>Gửi ticket mới ngay</Button>
            )
          }
        />
      ) : (
        <div className="space-y-4">
          <Card className="border-border overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border py-4">
              <CardTitle className="text-base flex items-center justify-between">
                <span>Danh sách Ticket</span>
                <span className="text-sm font-normal text-muted-foreground">{totalItems} kết quả</span>
              </CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[120px]">Mã Ticket</TableHead>
                    <TableHead>Tiêu đề & Dịch vụ</TableHead>
                    <TableHead className="w-[140px]">Độ ưu tiên</TableHead>
                    <TableHead className="w-[160px]">Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets.map((ticket) => {
                    const status = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.PENDING
                    const priority = PRIORITY_CONFIG[ticket.aiAnalysis?.priority] || PRIORITY_CONFIG.MEDIUM

                    return (
                      <TableRow 
                        key={ticket.id} 
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleRowClick(ticket.id)}
                      >
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          #{ticket.id.split('-')[2] || ticket.id.substring(0, 8)}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-foreground line-clamp-1">{ticket.title}</div>
                          <div className="text-xs text-muted-foreground mt-1">{ticket.serviceType}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={priority.color}>
                            {priority.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={status.color}>
                            <div className={`w-1.5 h-1.5 rounded-full ${status.dot} mr-2`}></div>
                            {status.label}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>

          {totalPages > 1 && (
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
      )}
    </div>
  )
}
