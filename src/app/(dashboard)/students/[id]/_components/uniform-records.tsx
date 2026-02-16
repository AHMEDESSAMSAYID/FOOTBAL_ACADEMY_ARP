"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Textarea } from "@/components/ui/textarea";
import {
  createUniformRecord,
  updateUniformRecord,
  deleteUniformRecord,
} from "@/lib/actions/uniforms";
import { toast } from "sonner";
import { Plus, Loader2, Trash2, Shirt, CheckCircle2, AlertCircle } from "lucide-react";

interface UniformRecord {
  id: string;
  studentId: string;
  uniformType: "red" | "navy";
  givenDate: string;
  price: string;
  isPaid: boolean;
  paidDate: string | null;
  notes: string | null;
  createdAt: Date;
}

interface UniformRecordsProps {
  studentId: string;
  records: UniformRecord[];
}

export function UniformRecords({ studentId, records }: UniformRecordsProps) {
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Add form state
  const [uniformType, setUniformType] = useState<"red" | "navy">("red");
  const [givenDate, setGivenDate] = useState(new Date().toISOString().split("T")[0]);
  const [price, setPrice] = useState("");
  const [isPaid, setIsPaid] = useState(false);
  const [paidDate, setPaidDate] = useState("");
  const [notes, setNotes] = useState("");

  const resetForm = () => {
    setUniformType("red");
    setGivenDate(new Date().toISOString().split("T")[0]);
    setPrice("");
    setIsPaid(false);
    setPaidDate("");
    setNotes("");
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!price || parseFloat(price) <= 0) {
      toast.error("يرجى إدخال السعر");
      return;
    }

    startTransition(async () => {
      const result = await createUniformRecord({
        studentId,
        uniformType,
        givenDate,
        price: parseFloat(price),
        isPaid,
        paidDate: isPaid ? (paidDate || givenDate) : undefined,
        notes: notes || undefined,
      });

      if (result.success) {
        toast.success("تم إضافة سجل الزي");
        setAddOpen(false);
        resetForm();
        router.refresh();
      } else {
        toast.error(result.error || "فشل في الإضافة");
      }
    });
  };

  const handleMarkPaid = (record: UniformRecord) => {
    startTransition(async () => {
      const result = await updateUniformRecord({
        id: record.id,
        studentId,
        isPaid: true,
        paidDate: new Date().toISOString().split("T")[0],
      });

      if (result.success) {
        toast.success("تم تسجيل الدفع");
        router.refresh();
      } else {
        toast.error(result.error || "فشل في التحديث");
      }
    });
  };

  const handleDelete = (record: UniformRecord) => {
    if (!confirm("هل تريد حذف هذا السجل؟")) return;
    startTransition(async () => {
      const result = await deleteUniformRecord(record.id, studentId);

      if (result.success) {
        toast.success("تم حذف السجل");
        router.refresh();
      } else {
        toast.error(result.error || "فشل في الحذف");
      }
    });
  };

  const unpaidRed = records.filter(r => r.uniformType === "red" && !r.isPaid);
  const unpaidNavy = records.filter(r => r.uniformType === "navy" && !r.isPaid);

  return (
    <div className="space-y-4">
      {/* Summary badges */}
      <div className="flex flex-wrap items-center gap-2">
        {unpaidRed.length > 0 && (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            {unpaidRed.length} زي أحمر غير مدفوع
          </Badge>
        )}
        {unpaidNavy.length > 0 && (
          <Badge variant="outline" className="text-blue-700 border-blue-300 gap-1">
            {unpaidNavy.length} زي كحلي غير مدفوع
          </Badge>
        )}
        {records.length > 0 && unpaidRed.length === 0 && unpaidNavy.length === 0 && (
          <Badge variant="outline" className="text-green-700 border-green-300 gap-1">
            <CheckCircle2 className="h-3 w-3" />
            جميع الأزياء مدفوعة
          </Badge>
        )}
      </div>

      {/* Records list */}
      {records.length === 0 ? (
        <div className="text-center py-6 text-zinc-500 text-sm">
          لا يوجد سجلات زي
        </div>
      ) : (
        <div className="space-y-2">
          {records.map((record) => (
            <div
              key={record.id}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                record.uniformType === "red"
                  ? record.isPaid
                    ? "bg-red-50 border-red-100"
                    : "bg-red-100 border-red-300"
                  : record.isPaid
                    ? "bg-blue-50 border-blue-100"
                    : "bg-blue-100 border-blue-200"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    record.uniformType === "red" ? "bg-red-500" : "bg-blue-900"
                  }`}
                >
                  <Shirt className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                      {record.uniformType === "red" ? "زي أحمر" : "زي كحلي"}
                    </span>
                    <span className="text-sm font-medium">{record.price} TL</span>
                    {record.uniformType === "red" && !record.isPaid && (
                      <Badge variant="destructive" className="text-[10px] px-1.5 py-0">مطلوب</Badge>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500">
                    تسليم: {record.givenDate}
                    {record.isPaid ? (
                      <span className="text-green-600"> • دفع: {record.paidDate}</span>
                    ) : (
                      <span className="text-red-600"> • غير مدفوع</span>
                    )}
                  </p>
                  {record.notes && (
                    <p className="text-xs text-zinc-400 mt-0.5">{record.notes}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                {!record.isPaid && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMarkPaid(record)}
                    disabled={isPending}
                    className="text-green-700 border-green-300 hover:bg-green-50 text-xs"
                  >
                    {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "تم الدفع"}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(record)}
                  disabled={isPending}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add uniform dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="w-full">
            <Plus className="h-4 w-4 ms-2" />
            إضافة زي
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[400px]">
          <form onSubmit={handleAdd}>
            <DialogHeader>
              <DialogTitle>إضافة زي جديد</DialogTitle>
              <DialogDescription>
                سجل تسليم زي جديد للطالب
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {/* Uniform Type */}
              <div className="grid gap-2">
                <Label>نوع الزي *</Label>
                <Select
                  value={uniformType}
                  onValueChange={(v) => setUniformType(v as "red" | "navy")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="red">
                      <span className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
                        زي أحمر (مطلوب)
                      </span>
                    </SelectItem>
                    <SelectItem value="navy">
                      <span className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-blue-900 inline-block" />
                        زي كحلي (اختياري)
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Given Date */}
              <div className="grid gap-2">
                <Label htmlFor="givenDate">تاريخ التسليم *</Label>
                <Input
                  id="givenDate"
                  type="date"
                  value={givenDate}
                  onChange={(e) => setGivenDate(e.target.value)}
                  required
                  dir="ltr"
                />
              </div>

              {/* Price */}
              <div className="grid gap-2">
                <Label htmlFor="uniformRecordPrice">السعر (TL) *</Label>
                <Input
                  id="uniformRecordPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="300"
                  dir="ltr"
                  required
                />
              </div>

              {/* Paid */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="uniformRecordPaid"
                    checked={isPaid}
                    onCheckedChange={(checked) => setIsPaid(checked === true)}
                  />
                  <Label htmlFor="uniformRecordPaid" className="text-sm">مدفوع</Label>
                </div>
                {isPaid && (
                  <Input
                    type="date"
                    value={paidDate}
                    onChange={(e) => setPaidDate(e.target.value)}
                    className="flex-1"
                    dir="ltr"
                    placeholder="تاريخ الدفع"
                  />
                )}
              </div>

              {/* Notes */}
              <div className="grid gap-2">
                <Label htmlFor="uniformRecordNotes">ملاحظات</Label>
                <Textarea
                  id="uniformRecordNotes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="مثلاً: تلف الزي السابق أثناء التدريب"
                  rows={2}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "حفظ"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
