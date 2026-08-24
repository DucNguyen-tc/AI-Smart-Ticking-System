import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, MessageCircleQuestion, AlertCircle } from 'lucide-react'
import { faqService } from '@/services/faqService'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/useAuthStore'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'

export function FAQPage() {
  const [faqs, setFaqs] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const { isAuthenticated } = useAuthStore()

  useEffect(() => {
    const fetchFaqs = async () => {
      if (!isAuthenticated) {
        setIsLoading(false)
        return
      }

      try {
        const response = await faqService.getAll()
        // Dữ liệu API trả về nằm trong response.data
        setFaqs(response.data || [])
      } catch (error) {
        toast.error(error.message || 'Không thể tải danh sách FAQ')
      } finally {
        setIsLoading(false)
      }
    }

    fetchFaqs()
  }, [isAuthenticated])

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-[60vh] text-center animate-page-in">
        <AlertCircle className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
        <h2 className="text-2xl font-bold mb-2">Yêu cầu Đăng nhập</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          Bạn cần đăng nhập để xem các câu hỏi thường gặp và tài liệu hướng dẫn của chúng tôi.
        </p>
        <div className="flex gap-4">
          <Button asChild className="btn-lift">
            <Link to="/login">Đăng nhập ngay</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl animate-page-in">
      <div className="flex flex-col items-center text-center mb-10 space-y-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <MessageCircleQuestion className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Câu hỏi thường gặp (FAQ)</h1>
        <p className="text-muted-foreground max-w-xl">
          Tìm kiếm câu trả lời nhanh chóng cho các vấn đề phổ biến nhất.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : faqs.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
          Hiện tại chưa có câu hỏi thường gặp nào.
        </div>
      ) : (
        <div className="grid gap-6">
          {faqs.map((faq) => (
            <Card key={faq.id} className="card-hover">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <CardTitle className="text-xl leading-tight">
                    {faq.question}
                  </CardTitle>
                  <Badge variant="outline" className="bg-primary/5 shrink-0 whitespace-nowrap">
                    {faq.category}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {faq.answer}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
