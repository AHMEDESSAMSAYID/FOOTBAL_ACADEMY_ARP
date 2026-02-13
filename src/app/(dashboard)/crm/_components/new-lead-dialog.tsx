"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createLead } from "@/lib/actions/leads";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface NewLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SOURCES = [
  { value: "facebook", label: "فيسبوك" },
  { value: "instagram", label: "انستجرام" },
  { value: "referral", label: "توصية" },
  { value: "walk_in", label: "زيارة مباشرة" },
  { value: "phone", label: "اتصال" },
  { value: "whatsapp", label: "واتساب" },
  { value: "other", label: "أخرى" },
];

export function NewLeadDialog({ open, onOpenChange }: NewLeadDialogProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    childName: "",
    age: "",
    area: "",
    source: "",
    nextFollowup: "",
  });

  const handleSubmit = async () => {
    if (!formData.name || !formData.phone) {
      toast.error("الاسم ورقم الهاتف مطلوبان");
      return;
    }

    setIsLoading(true);
    try {
      const result = await createLead({
        name: formData.name,
        phone: formData.phone,
        childName: formData.childName || undefined,
        age: formData.age ? parseInt(formData.age) : undefined,
        area: formData.area || undefined,
        source: formData.source || undefined,
        nextFollowup: formData.nextFollowup || undefined,
      });

      if (result.success) {
        toast.success("تم إضافة العميل بنجاح");
        onOpenChange(false);
        setFormData({
          name: "",
          phone: "",
          childName: "",
          age: "",
          area: "",
          source: "",
          nextFollowup: "",
        });
        router.refresh();
      } else {
        toast.error(result.error || "حدث خطأ");
      }
    } catch {
      toast.error("فشل في إضافة العميل");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>عميل محتمل جديد</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">اسم ولي الأمر *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="الاسم"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">رقم الهاتف *</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="01xxxxxxxxx"
                dir="ltr"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="childName">اسم الطفل</Label>
              <Input
                id="childName"
                value={formData.childName}
                onChange={(e) => setFormData({ ...formData, childName: e.target.value })}
                placeholder="اسم الطفل"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="age">العمر</Label>
              <Input
                id="age"
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                placeholder="سنة"
                min="3"
                max="50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="area">المنطقة</Label>
            <Input
              id="area"
              value={formData.area}
              onChange={(e) => setFormData({ ...formData, area: e.target.value })}
              placeholder="المنطقة / الحي"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="source">مصدر العميل</Label>
            <Select
              value={formData.source}
              onValueChange={(v) => setFormData({ ...formData, source: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر المصدر" />
              </SelectTrigger>
              <SelectContent>
                {SOURCES.map((source) => (
                  <SelectItem key={source.value} value={source.value}>
                    {source.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nextFollowup">موعد المتابعة</Label>
            <Input
              id="nextFollowup"
              type="date"
              value={formData.nextFollowup}
              onChange={(e) => setFormData({ ...formData, nextFollowup: e.target.value })}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            إلغاء
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? "جاري الحفظ..." : "حفظ"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
