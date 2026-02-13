"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { createContact } from "@/lib/actions/contacts";

interface AddContactDialogProps {
  studentId: string;
}

export function AddContactDialog({ studentId }: AddContactDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    relation: "",
    phone: "",
    email: "",
    isPrimaryPayer: false,
    telegramId: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!formData.name || !formData.phone) {
      toast.error("الاسم ورقم الهاتف مطلوبان");
      return;
    }
    
    setLoading(true);
    
    try {
      const result = await createContact({
        studentId,
        name: formData.name,
        relation: formData.relation as "father" | "mother" | "guardian" | "other" | undefined,
        phone: formData.phone,
        email: formData.email || undefined,
        isPrimaryPayer: formData.isPrimaryPayer,
        telegramId: formData.telegramId || undefined,
      });
      
      if (result.success) {
        toast.success("تم إضافة جهة الاتصال بنجاح");
        setOpen(false);
        setFormData({
          name: "",
          relation: "",
          phone: "",
          email: "",
          isPrimaryPayer: false,
          telegramId: "",
        });
        router.refresh();
      } else {
        toast.error(result.error || "فشل في الإضافة");
      }
    } catch {
      toast.error("حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <span className="ml-2">➕</span>
          إضافة جهة اتصال
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>إضافة جهة اتصال جديدة</DialogTitle>
            <DialogDescription>
              أدخل بيانات ولي الأمر أو المسؤول عن اللاعب
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">الاسم *</Label>
              <Input
                id="name"
                placeholder="اسم ولي الأمر"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="relation">صلة القرابة</Label>
              <Select 
                value={formData.relation} 
                onValueChange={(value) => setFormData({ ...formData, relation: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر صلة القرابة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="father">الأب</SelectItem>
                  <SelectItem value="mother">الأم</SelectItem>
                  <SelectItem value="guardian">ولي الأمر</SelectItem>
                  <SelectItem value="other">آخر</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">رقم الهاتف *</Label>
              <Input
                id="phone"
                placeholder="05xxxxxxxx"
                dir="ltr"
                className="text-left"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@email.com"
                dir="ltr"
                className="text-left"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="telegram">معرف تيليجرام</Label>
              <Input
                id="telegram"
                placeholder="@username"
                dir="ltr"
                className="text-left"
                value={formData.telegramId}
                onChange={(e) => setFormData({ ...formData, telegramId: e.target.value })}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPrimaryPayer"
                checked={formData.isPrimaryPayer}
                onChange={(e) => setFormData({ ...formData, isPrimaryPayer: e.target.checked })}
                className="h-4 w-4 rounded border-zinc-300"
              />
              <Label htmlFor="isPrimaryPayer" className="text-sm font-normal">
                المحصل الرسمي (المسؤول عن الدفع)
              </Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              إلغاء
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "جاري الإضافة..." : "إضافة"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
