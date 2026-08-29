import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { ChevronLeft, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuthStore } from '@/stores/useAuthStore'
import { ticketService } from '@/services/ticketService'

const formSchema = z.object({
  service_type: z.enum(["ECOMMERCE", "SOFTWARE", "PAYMENT", "GENERAL"], {
    required_error: "Vui lòng chọn loại dịch vụ.",
  }),
  title: z.string().min(5, { message: "Tiêu đề phải có ít nhất 5 ký tự." }),
  description: z.string().min(20, { message: "Nội dung chi tiết phải có ít nhất 20 ký tự." }),
})

export function SubmitTicketPage() {
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuthStore()
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      toast.info("Vui lòng đăng nhập để gửi yêu cầu hỗ trợ.")
      navigate('/login')
    }
  }, [isAuthenticated, navigate])

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      service_type: undefined,
      title: "",
      description: "",
    },
  })

  async function onSubmit(values) {
    setIsSubmitting(true)

    try {
      const payload = {
        title: values.title,
        content: values.description,
        serviceType: values.service_type,
      }
      
      const response = await ticketService.create(payload)
      const newTicketId = response.data?.id || crypto.randomUUID()
      
      navigate('/submit-ticket/success', { state: { ticket_id: newTicketId } })
    } catch (error) {
      if (error?.response?.status === 429) {
        toast.error("Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau ít phút.")
      } else {
        toast.error(error.message || "Có lỗi xảy ra. Vui lòng thử lại sau.")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-[640px]">
      <div className="mb-6">
        <Button variant="ghost" asChild className="pl-0 hover:bg-transparent hover:text-primary">
          <Link to="/">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Quay lại Trang chủ
          </Link>
        </Button>
      </div>

      <Card className="border-border">
        <CardHeader className="text-center pb-8">
          <CardTitle className="text-2xl font-bold">Gửi Yêu cầu Hỗ trợ</CardTitle>
          <CardDescription>
            Mô tả chi tiết vấn đề để chúng tôi có thể hỗ trợ bạn tốt nhất.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              <FormField
                control={form.control}
                name="service_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Loại dịch vụ *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn loại dịch vụ" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ECOMMERCE">Thương mại điện tử (ECOMMERCE)</SelectItem>
                        <SelectItem value="SOFTWARE">Phần mềm (SOFTWARE)</SelectItem>
                        <SelectItem value="PAYMENT">Thanh toán (PAYMENT)</SelectItem>
                        <SelectItem value="GENERAL">Khác (GENERAL)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tiêu đề yêu cầu *</FormLabel>
                    <FormControl>
                      <Input placeholder="Tôi bị trừ tiền 2 lần..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nội dung chi tiết *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Mô tả chi tiết vấn đề của bạn..." 
                        className="min-h-[120px] resize-y" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang gửi...
                  </>
                ) : (
                  "🚀 Gửi Yêu cầu Hỗ trợ"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
