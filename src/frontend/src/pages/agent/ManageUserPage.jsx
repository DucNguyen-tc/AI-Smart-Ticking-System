import React, { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Loader2, UserCircle2 } from "lucide-react";
import { toast } from "sonner";

import { userService } from "@/services/userService";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const ROLE_COLORS = {
  ADMIN: "bg-danger/10 text-danger border-danger/20",
  AGENT: "bg-primary/10 text-primary border-primary/20",
  CUSTOMER: "bg-muted text-muted-foreground border-border",
};

export function ManageUserPage() {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === "ADMIN";

  const [usersList, setUsersList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "CUSTOMER",
  });
  const [isSaving, setIsSaving] = useState(false);

  // Delete confirm state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadUsers = async (p = 1) => {
    setIsLoading(true);
    try {
      const res = await userService.getAll(p, limit);
      // Giả sử API trả về data: { data: [...], meta: { totalPages, ... } }
      setUsersList(res.data || []);
      if (res.meta?.totalPages) {
        setTotalPages(res.meta.totalPages);
      }
    } catch (err) {
      toast.error(err.message || "Lỗi khi tải danh sách người dùng");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers(page);
  }, [page]);

  const openAddModal = () => {
    setEditingUser(null);
    setFormData({ name: "", email: "", password: "", role: "CUSTOMER" });
    setIsModalOpen(true);
  };

  const openEditModal = (u) => {
    setEditingUser(u);
    setFormData({
      name: u.name,
      email: u.email,
      password: "", // Mật khẩu thường không trả về, và nếu sửa thì nhập mới
      role: u.role,
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error("Vui lòng nhập Tên và Email.");
      return;
    }
    if (!editingUser && !formData.password.trim()) {
      toast.error("Vui lòng nhập Mật khẩu cho tài khoản mới.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = { ...formData };
      if (editingUser && !payload.password) {
        delete payload.password; // Không gửi password nếu để trống khi sửa
      }

      if (editingUser) {
        await userService.update(editingUser.id, payload);
        toast.success("Đã cập nhật tài khoản!");
        loadUsers(page);
      } else {
        await userService.create(payload);
        toast.success("Đã tạo tài khoản mới!");
        loadUsers(page);
      }
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err.message || "Có lỗi xảy ra khi lưu");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await userService.remove(deleteTarget.id);
      toast.success("Đã xóa tài khoản!");
      setDeleteTarget(null);
      
      // Load lại trang hiện tại hoặc trang trước nếu trang hiện tại rỗng
      if (usersList.length === 1 && page > 1) {
        setPage(p => p - 1);
      } else {
        loadUsers(page);
      }
    } catch (err) {
      toast.error(err.message || "Có lỗi xảy ra khi xóa");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <UserCircle2 className="w-6 h-6 text-primary" />
          Quản lý Người dùng
        </h1>
        {isAdmin && (
          <Button onClick={openAddModal} className="btn-lift">
            <Plus className="w-4 h-4 mr-2" />
            Thêm tài khoản
          </Button>
        )}
      </div>

      <Card className="border-border overflow-hidden shadow-sm">
        {isLoading ? (
          <CardContent className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </CardContent>
        ) : usersList.length === 0 ? (
          <CardContent className="p-12 text-center text-muted-foreground">
            Không tìm thấy người dùng nào.
          </CardContent>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-16">STT</TableHead>
                    <TableHead>Họ tên</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="w-[120px]">Vai trò</TableHead>
                    {isAdmin && (
                      <TableHead className="w-[100px] text-center">
                        Hành động
                      </TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersList.map((u, index) => (
                    <TableRow key={u.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="text-muted-foreground font-mono">
                        {(page - 1) * limit + index + 1}
                      </TableCell>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell className="text-muted-foreground">{u.email}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            ROLE_COLORS[u.role] || ROLE_COLORS.CUSTOMER
                          }
                        >
                          {u.role}
                        </Badge>
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          <div className="flex justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditModal(u)}
                              className="h-8 w-8 hover:text-primary"
                              title="Sửa"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteTarget(u)}
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              title="Xóa"
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
            
            {/* Phân trang */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-border flex justify-end">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                    <PaginationItem>
                      <span className="px-4 text-sm font-medium text-muted-foreground">
                        Trang {page} / {totalPages}
                      </span>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        className={page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Add/Edit Modal */}
      {isAdmin && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingUser ? "Sửa Tài khoản" : "Tạo Tài khoản mới"}</DialogTitle>
              <DialogDescription>
                {editingUser
                  ? "Cập nhật thông tin tài khoản người dùng."
                  : "Điền thông tin bên dưới để tạo mới tài khoản (Agent, Admin, hoặc Customer)."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Họ tên</Label>
                <Input
                  placeholder="Ví dụ: Nguyễn Văn A"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="nhap@email.com"
                  value={formData.email}
                  disabled={!!editingUser} // Thường không cho đổi email
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>{editingUser ? "Mật khẩu mới (Để trống nếu không đổi)" : "Mật khẩu"}</Label>
                <Input
                  type="password"
                  placeholder={editingUser ? "••••••••" : "Nhập mật khẩu..."}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, password: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Phân quyền (Role)</Label>
                <Select
                  value={formData.role}
                  onValueChange={(v) =>
                    setFormData((prev) => ({ ...prev, role: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CUSTOMER">Khách hàng (CUSTOMER)</SelectItem>
                    <SelectItem value="AGENT">Nhân viên CSKH (AGENT)</SelectItem>
                    <SelectItem value="ADMIN">Quản trị viên (ADMIN)</SelectItem>
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
                  "💾 Lưu tài khoản"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirm Modal */}
      {isAdmin && (
        <Dialog
          open={!!deleteTarget}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
        >
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Xác nhận xóa</DialogTitle>
              <DialogDescription>
                Bạn có chắc muốn xóa tài khoản:{" "}
                <strong className="text-foreground">{deleteTarget?.email}</strong>?
                <br /><br />
                <span className="text-danger font-medium">Lưu ý:</span> Hành động này không thể hoàn tác và có thể ảnh hưởng tới các ticket liên quan.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4">
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
      )}
    </div>
  );
}
