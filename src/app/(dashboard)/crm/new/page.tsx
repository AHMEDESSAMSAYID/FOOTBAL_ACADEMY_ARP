"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const SOURCES = [
  { value: "facebook", label: "فيسبوك" },
  { value: "instagram", label: "انستجرام" },
  { value: "referral", label: "توصية" },
  { value: "walk_in", label: "زيارة مباشرة" },
  { value: "phone", label: "اتصال" },
  { value: "whatsapp", label: "واتساب" },
  { value: "other", label: "أخرى" },
];

export default function NewLeadPage() {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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

      if (result.success && result.lead) {
        toast.success("تم إضافة العميل بنجاح");
        router.push(`/crm/${result.lead.id}`);
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
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Link href="/crm">
          <Button variant="ghost" size="sm">
            <ArrowRight className="h-4 w-4 ml-1" />
            رجوع
          </Button>
        </Link>
        <h1 className="text-xl font-bold">عميل محتمل جديد</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">بيانات العميل</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">اسم ولي الأمر *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="الاسم"
                  required
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
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="flex-1"
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? "جاري الحفظ..." : "حفظ"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
