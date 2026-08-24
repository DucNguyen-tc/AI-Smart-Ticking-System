class ApiError extends Error {
  constructor(message, status, data) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

// =============================================
// MOCK DATA
// =============================================

const SENTIMENTS = ['ANGRY', 'FRUSTRATED', 'NEUTRAL', 'SATISFIED']
const CATEGORIES = ['REFUND', 'SHIPPING', 'ACCOUNT', 'BILLING', 'TECHNICAL', 'GENERAL']
const SENTIMENT_EMOJI = { ANGRY: '😡', FRUSTRATED: '😤', NEUTRAL: '😐', SATISFIED: '😊' }

const CUSTOMER_NAMES = [
  'Nguyễn Văn A', 'Trần Thị B', 'Lê Văn C', 'Phạm Minh D',
  'Hoàng Thu E', 'Vũ Đình F', 'Đặng Thanh G', 'Bùi Quốc H',
  'Ngô Hoàng I', 'Dương Xuân K', 'Hồ Ngọc L', 'Mai Anh M',
]

const TITLES = [
  'Bị trừ tiền 2 lần khi thanh toán',
  'Không thể đăng nhập tài khoản',
  'Hàng giao sai sản phẩm',
  'Yêu cầu hoàn tiền đơn hàng #1234',
  'Lỗi phần mềm khi xuất báo cáo',
  'Không nhận được email xác nhận',
  'Thời gian giao hàng quá lâu',
  'Hỏi về chính sách bảo hành',
  'Tài khoản bị khóa vô cớ',
  'Lỗi hiển thị trên ứng dụng mobile',
  'Cần hỗ trợ kỹ thuật cài đặt',
  'Khiếu nại dịch vụ chăm sóc khách hàng',
]

// Customer-facing mock tickets
const MOCK_TICKETS = Array.from({ length: 12 }).map((_, i) => ({
  id: `mock-uuid-${i + 1}`,
  title: i % 2 === 0 ? `Lỗi thanh toán đơn hàng #${i + 1}` : `Không thể truy cập phần mềm #${i + 1}`,
  service_type: i % 2 === 0 ? 'PAYMENT' : 'SOFTWARE',
  priority: i === 0 ? 'URGENT' : i % 3 === 0 ? 'HIGH' : 'MEDIUM',
  status: i === 0 ? 'PENDING' : i % 3 === 0 ? 'PROCESSED' : 'RESOLVED',
  created_at: new Date(Date.now() - i * 86400000).toISOString(),
  description: "Vào lúc sáng nay tôi thực hiện thanh toán nhưng tài khoản bị trừ 2 lần...",
  replies: [
    {
      id: `reply-${i}-1`,
      content: 'Chào bạn, chúng tôi đang kiểm tra lại giao dịch này.',
      created_at: new Date(Date.now() - i * 86400000 + 3600000).toISOString(),
      is_internal_note: false,
      sender: { name: 'CSKH Team', role: 'AGENT' }
    },
    {
      id: `reply-${i}-2`,
      content: 'Note nội bộ: Khách hàng VIP, cần xử lý gấp.',
      created_at: new Date(Date.now() - i * 86400000 + 3600000).toISOString(),
      is_internal_note: true,
      sender: { name: 'System', role: 'SYSTEM' }
    }
  ]
}))

// Agent-facing mock tickets (richer data with AI analysis)
const MOCK_AGENT_TICKETS = Array.from({ length: 24 }).map((_, i) => {
  const sentiment = SENTIMENTS[i % SENTIMENTS.length]
  const category = CATEGORIES[i % CATEGORIES.length]
  const priorities = ['URGENT', 'HIGH', 'MEDIUM', 'LOW']
  const priority = i < 3 ? 'URGENT' : priorities[i % priorities.length]
  const statuses = ['PENDING', 'PROCESSED', 'RESOLVED', 'CLOSED']
  const status = i < 2 ? 'PENDING' : statuses[i % statuses.length]

  return {
    id: `agent-ticket-${i + 1}`,
    title: TITLES[i % TITLES.length],
    description: `Chi tiết vấn đề #${i + 1}: Tôi gặp sự cố nghiêm trọng khi sử dụng dịch vụ. Cụ thể, vào lúc 9:30 sáng ngày hôm nay, tôi đã thực hiện thao tác nhưng hệ thống không phản hồi đúng. Tôi đã thử lại nhiều lần nhưng vẫn không được. Rất mong được hỗ trợ sớm nhất có thể.`,
    service_type: ['PAYMENT', 'SOFTWARE', 'ECOMMERCE', 'GENERAL'][i % 4],
    priority,
    status,
    sentiment,
    category,
    created_at: new Date(Date.now() - i * 3600000 * (i % 3 + 1)).toISOString(),
    customer_name: CUSTOMER_NAMES[i % CUSTOMER_NAMES.length],
    customer_email: `user${i + 1}@gmail.com`,
    ai_analysis: {
      sentiment: { label: sentiment, emoji: SENTIMENT_EMOJI[sentiment], score: 0.7 + Math.random() * 0.3 },
      priority: { label: priority, confidence: 0.8 + Math.random() * 0.2 },
      category: { label: category, confidence: 0.75 + Math.random() * 0.25 },
      summary: `Khách hàng ${CUSTOMER_NAMES[i % CUSTOMER_NAMES.length]} gặp vấn đề liên quan đến ${category.toLowerCase()}. Cảm xúc khách hàng hiện tại là ${sentiment.toLowerCase()}, cần được xử lý ${priority === 'URGENT' ? 'ngay lập tức' : 'sớm'}.`,
      suggested_reply: `Chào anh/chị ${CUSTOMER_NAMES[i % CUSTOMER_NAMES.length]},\n\nCảm ơn anh/chị đã liên hệ với bộ phận CSKH của chúng tôi. Em đã tiếp nhận yêu cầu của anh/chị và đang kiểm tra chi tiết.\n\nChúng tôi sẽ phản hồi trong thời gian sớm nhất.\n\nTrân trọng,\nĐội ngũ CSKH`
    },
    replies: [
      ...(status !== 'PENDING' ? [{
        id: `areply-${i}-1`,
        content: `Chào ${CUSTOMER_NAMES[i % CUSTOMER_NAMES.length]}, chúng tôi đã tiếp nhận và đang xử lý yêu cầu của bạn. Vui lòng chờ trong giây lát.`,
        created_at: new Date(Date.now() - i * 3600000 * (i % 3 + 1) + 1800000).toISOString(),
        is_internal_note: false,
        sender: { name: 'Agent A', role: 'AGENT' }
      }] : []),
      {
        id: `areply-${i}-2`,
        content: `Ghi chú nội bộ: Ticket #${i + 1} - ${priority} - Cần kiểm tra lại hệ thống.`,
        created_at: new Date(Date.now() - i * 3600000 * (i % 3 + 1) + 900000).toISOString(),
        is_internal_note: true,
        sender: { name: 'Agent A', role: 'AGENT' }
      }
    ]
  }
})

// Mock FAQs
const MOCK_FAQS = [
  { id: 'faq-1', question: 'Làm sao yêu cầu hoàn tiền khi hủy đơn?', answer: 'Bạn có thể yêu cầu hoàn tiền bằng cách vào mục "Đơn hàng" → chọn đơn cần hủy → bấm "Yêu cầu hoàn tiền". Tiền sẽ được hoàn trong 3-5 ngày làm việc.', category: 'REFUND', is_active: true },
  { id: 'faq-2', question: 'Thời gian giao hàng bao lâu?', answer: 'Thời gian giao hàng tiêu chuẩn là 3-5 ngày làm việc. Đối với giao hàng nhanh, thời gian là 1-2 ngày làm việc.', category: 'SHIPPING', is_active: true },
  { id: 'faq-3', question: 'Cách đổi mật khẩu tài khoản?', answer: 'Vào Cài đặt → Bảo mật → Đổi mật khẩu. Nhập mật khẩu cũ và mật khẩu mới, sau đó bấm "Lưu thay đổi".', category: 'ACCOUNT', is_active: true },
  { id: 'faq-4', question: 'Chính sách bảo hành sản phẩm?', answer: 'Tất cả sản phẩm được bảo hành 12 tháng kể từ ngày mua. Vui lòng giữ hóa đơn để được hỗ trợ bảo hành.', category: 'GENERAL', is_active: true },
  { id: 'faq-5', question: 'Làm sao liên hệ bộ phận hỗ trợ?', answer: 'Bạn có thể gửi ticket qua hệ thống này hoặc gọi hotline 1900-xxxx trong giờ hành chính.', category: 'GENERAL', is_active: true },
]

// =============================================
// MOCK INTERCEPTOR HANDLER
// =============================================
function handleMock(endpoint, options) {
  const method = (options?.method || 'GET').toUpperCase()

  // --- CUSTOMER ENDPOINTS ---
  // GET /customer/tickets?email=...
  if (endpoint.startsWith('/customer/tickets') && !endpoint.includes('mock-uuid')) {
    const url = new URL(`http://localhost${endpoint}`)
    const email = url.searchParams.get('email')
    if (email === 'test@gmail.com') {
      return { data: MOCK_TICKETS, total: MOCK_TICKETS.length }
    }
    return { data: [], total: 0 }
  }

  // GET /customer/tickets/:id
  if (endpoint.startsWith('/customer/tickets/mock-uuid-')) {
    const id = endpoint.split('/').pop()
    const ticket = MOCK_TICKETS.find(t => t.id === id)
    if (ticket) return ticket
    throw new ApiError('Not Found', 404, { message: 'Ticket không tồn tại' })
  }

  // --- AGENT ENDPOINTS ---
  // GET /tickets (agent dashboard list)
  if (endpoint.startsWith('/tickets') && method === 'GET' && !endpoint.includes('agent-ticket-')) {
    const url = new URL(`http://localhost${endpoint}`)
    const priority = url.searchParams.get('priority')
    const status = url.searchParams.get('status')
    const sentiment = url.searchParams.get('sentiment')
    const search = url.searchParams.get('search')

    let filtered = [...MOCK_AGENT_TICKETS]
    if (priority) filtered = filtered.filter(t => t.priority === priority)
    if (status) filtered = filtered.filter(t => t.status === status)
    if (sentiment) filtered = filtered.filter(t => t.sentiment === sentiment)
    if (search) filtered = filtered.filter(t => t.title.toLowerCase().includes(search.toLowerCase()) || t.customer_name.toLowerCase().includes(search.toLowerCase()))

    return {
      data: filtered,
      total: filtered.length,
      stats: {
        urgent: MOCK_AGENT_TICKETS.filter(t => t.priority === 'URGENT').length,
        pending: MOCK_AGENT_TICKETS.filter(t => t.status === 'PENDING').length,
        processed: MOCK_AGENT_TICKETS.filter(t => t.status === 'PROCESSED').length,
        resolved: MOCK_AGENT_TICKETS.filter(t => t.status === 'RESOLVED').length,
      }
    }
  }

  // GET /tickets/:id (agent ticket detail)
  if (endpoint.match(/^\/tickets\/agent-ticket-\d+$/)) {
    const id = endpoint.split('/').pop()
    const ticket = MOCK_AGENT_TICKETS.find(t => t.id === id)
    if (ticket) return { ...ticket }
    throw new ApiError('Not Found', 404, { message: 'Ticket không tồn tại' })
  }

  // POST /tickets/:id/reply
  if (endpoint.match(/^\/tickets\/agent-ticket-\d+\/reply$/) && method === 'POST') {
    return { success: true, message: 'Đã gửi phản hồi thành công' }
  }

  // --- FAQ ENDPOINTS ---
  // GET /faqs
  if (endpoint === '/faqs' && method === 'GET') {
    return { data: MOCK_FAQS.filter(f => f.is_active) }
  }

  // POST /faqs
  if (endpoint === '/faqs' && method === 'POST') {
    return { success: true, id: `faq-${Date.now()}` }
  }

  // PUT /faqs/:id
  if (endpoint.startsWith('/faqs/faq-') && method === 'PUT') {
    return { success: true }
  }

  // DELETE /faqs/:id
  if (endpoint.startsWith('/faqs/faq-') && method === 'DELETE') {
    return { success: true }
  }

  return null // No mock matched
}

// =============================================
// FETCH API WRAPPER
// =============================================
export async function fetchApi(endpoint, options = {}) {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1'
  const url = `${baseUrl}${endpoint}`

  // --- MOCK INTERCEPTOR ---
  if (import.meta.env.DEV) {
    const isMock = true // Đổi thành false khi muốn gọi backend thật
    if (isMock) {
      await new Promise(resolve => setTimeout(resolve, 600))
      const mockResult = handleMock(endpoint, options)
      if (mockResult !== null) return mockResult
    }
  }

  const defaultHeaders = {
    'Content-Type': 'application/json',
  }

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  }

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body)
  }

  try {
    const response = await fetch(url, config)
    if (response.status === 204) return null

    const data = await response.json().catch(() => null)

    if (!response.ok) {
      throw new ApiError(
        data?.message || response.statusText || 'Có lỗi xảy ra',
        response.status,
        data
      )
    }

    return data
  } catch (error) {
    if (error instanceof ApiError) throw error
    throw new ApiError('Lỗi kết nối đến máy chủ. Vui lòng kiểm tra mạng.', 0, null)
  }
}
