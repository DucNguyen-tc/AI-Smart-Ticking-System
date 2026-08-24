import React, { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { faqService } from "@/services/faqService";
import { useAuthStore } from "@/stores/useAuthStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CATEGORY_COLORS = {
  ECOMMERCE: "bg-info/10 text-info",
  SOFTWARE: "bg-primary/10 text-primary",
  PAYMENT: "bg-warning/10 text-warning",
  GENERAL: "bg-muted text-muted-foreground",
};

export function ManageFAQPage() {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === "ADMIN";

  const [faqs, setFaqs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null); // null = Add, object = Edit
  const [formData, setFormData] = useState({
    question: "",
    answer: "",
    category: "GENERAL",
  });
  const [isSaving, setIsSaving] = useState(false);

  // Delete confirm state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadFaqs = async () => {
    setIsLoading(true);
    try {
      const res = await faqService.getAll();
      setFaqs(res.data || []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFaqs();
  }, []);

  const openAddModal = () => {
    setEditingFaq(null);
    setFormData({ question: "", answer: "", category: "GENERAL" });
    setIsModalOpen(true);
  };

  const openEditModal = (faq) => {
    setEditingFaq(faq);
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.question.trim() || !formData.answer.trim()) {
      toast.error("Vui lòng điền đầy đủ câu hỏi và câu trả lời.");
      return;
    }
    setIsSaving(true);
    try {
      if (editingFaq) {
        await faqService.update(editingFaq.id, formData);
        // Update local state
        setFaqs((prev) =>
          prev.map((f) => (f.id === editingFaq.id ? { ...f, ...formData } : f)),
        );
        toast.success("Đã cập nhật FAQ!");
      } else {
        const res = await faqService.create(formData);
        setFaqs((prev) => [
          ...prev,
          { id: res.data?.id, ...formData, isActive: true },
        ]);
        toast.success("Đã thêm FAQ mới!");
      }
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await faqService.remove(deleteTarget.id);
      setFaqs((prev) => prev.filter((f) => f.id !== deleteTarget.id));
      toast.success("Đã xóa FAQ!");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Quản lý FAQ</h1>
        {isAdmin && (
          <Button onClick={openAddModal}>
            <Plus className="w-4 h-4 mr-2" />
            Thêm FAQ
          </Button>
        )}
      </div>

      <Card className="border-border overflow-hidden">
        {isLoading ? (
          <CardContent className="p-4 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </CardContent>
        ) : faqs.length === 0 ? (
          <CardContent className="p-12 text-center text-muted-foreground">
            Chưa có FAQ nào. Hãy tạo FAQ đầu tiên!
          </CardContent>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Câu hỏi</TableHead>
                  <TableHead className="w-[120px]">Chuyên mục</TableHead>
                  {isAdmin && (
                    <TableHead className="w-[100px] text-center">
                      Hành động
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {faqs.map((faq, index) => (
                  <TableRow key={faq.id} className="hover:bg-muted/50">
                    <TableCell className="text-muted-foreground font-mono">
                      {index + 1}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium line-clamp-2">
                        {faq.question}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 line-clamp-1">
                        {faq.answer}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={
                          CATEGORY_COLORS[faq.category] ||
                          CATEGORY_COLORS.GENERAL
                        }
                      >
                        {faq.category}
                      </Badge>
                    </TableCell>
                    {isAdmin && (
                      <TableCell>
                        <div className="flex justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditModal(faq)}
                            className="h-8 w-8"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteTarget(faq)}
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingFaq ? "Sửa FAQ" : "Thêm FAQ mới"}</DialogTitle>
            <DialogDescription>
              {editingFaq
                ? "Chỉnh sửa nội dung câu hỏi thường gặp."
                : "Tạo một câu hỏi thường gặp mới cho hệ thống."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Câu hỏi *</Label>
              <Input
                placeholder="Ví dụ: Làm sao yêu cầu hoàn tiền?"
                value={formData.question}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, question: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Câu trả lời *</Label>
              <Textarea
                placeholder="Nhập câu trả lời chi tiết..."
                className="min-h-[100px] resize-y"
                value={formData.answer}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, answer: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Chuyên mục</Label>
              <Select
                value={formData.category}
                onValueChange={(v) =>
                  setFormData((prev) => ({ ...prev, category: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GENERAL">Chung (GENERAL)</SelectItem>
                  <SelectItem value="ECOMMERCE">
                    Thương mại điện tử (ECOMMERCE)
                  </SelectItem>
                  <SelectItem value="SOFTWARE">Phần mềm (SOFTWARE)</SelectItem>
                  <SelectItem value="PAYMENT">Thanh toán (PAYMENT)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                "💾 Lưu"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Modal */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Xác nhận xóa FAQ</DialogTitle>
            <DialogDescription>
              Bạn có chắc muốn xóa câu hỏi:{" "}
              <strong>"{deleteTarget?.question}"</strong>?
              <br />
              Hành động này sẽ ẩn FAQ khỏi danh sách hiển thị.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang xóa...
                </>
              ) : (
                "🗑️ Xóa"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
