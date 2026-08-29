import React from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Bot, Zap } from 'lucide-react'

export function LandingPage() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-140px)]">
      {/* Hero Section */}
      <section className="relative flex-1 flex flex-col items-center justify-center text-center px-4 py-20 md:py-32">
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/20 opacity-20 blur-[100px]"></div>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 max-w-3xl text-transparent bg-clip-text bg-gradient-to-r from-foreground to-foreground/70">
          Hệ thống Hỗ trợ Khách hàng Thông minh
        </h1>
        <p className="text-xl text-muted-foreground mb-10 max-w-2xl">
          Gửi yêu cầu - AI phân tích - Phản hồi nhanh chóng
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Button asChild size="lg" className="w-full sm:w-auto font-medium h-12 px-8">
            <Link to="/submit-ticket">Gửi Yêu cầu Hỗ trợ</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full sm:w-auto font-medium h-12 px-8">
            <Link to="/track">Tra cứu Ticket</Link>
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <Card className="bg-card/50 backdrop-blur-sm border-muted">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary">
                  <FileText className="w-6 h-6" />
                </div>
                <CardTitle>Gửi ticket dễ dàng</CardTitle>
                <CardDescription>
                  Chỉ với vài thao tác đơn giản, bạn có thể tạo ngay một yêu cầu hỗ trợ và gửi đến hệ thống.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-muted">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-info/10 flex items-center justify-center mb-4 text-info">
                  <Bot className="w-6 h-6" />
                </div>
                <CardTitle>AI phân tích tự động</CardTitle>
                <CardDescription>
                  Trí tuệ nhân tạo sẽ lập tức phân tích nội dung, phân loại và xác định độ ưu tiên cho ticket của bạn.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-muted">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center mb-4 text-success">
                  <Zap className="w-6 h-6" />
                </div>
                <CardTitle>Phản hồi nhanh chóng</CardTitle>
                <CardDescription>
                  Đội ngũ CSKH nhận được thông tin chi tiết và phản hồi bạn trong thời gian ngắn nhất có thể.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
}
