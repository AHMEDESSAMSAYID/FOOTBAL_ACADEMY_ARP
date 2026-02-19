"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updatePayment } from "@/lib/actions/payments";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface EditPaymentFormProps {
  studentId: string;
  studentName: string;
  paymentId: string;
  feeConfig?: {
    monthlyFee: string;
    busFee: string | null;
  };
  initialData: {
    amount: string;
    paymentType: "monthly" | "bus" | "uniform";
    paymentMethod: "cash" | "bank_transfer";
    payerName: string | null;
    notes: string | null;
    paymentDate: string;
    coverageStart: string;
    coverageEnd: string;
  };
}

/** Calculate inclusive days between two YYYY-MM-DD strings */
function daysBetween(from: string, to: string): number {
  const a = new Date(from + "T00:00:00");
  const b = new Date(to + "T00:00:00");
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

export function EditPaymentForm({
  studentId,
  studentName,
  paymentId,
  feeConfig,
  initialData,
}: EditPaymentFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [paymentType, setPaymentType] = useState<"monthly" | "bus" | "uniform">(initialData.paymentType);
  const [amount, setAmount] = useState(initialData.amount);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "bank_transfer">(initialData.paymentMethod);
  const [payerName, setPayerName] = useState(initialData.payerName || "");
  const [notes, setNotes] = useState(initialData.notes || "");
  const [paymentDate, setPaymentDate] = useState(initialData.paymentDate);
  const [coverageFrom, setCoverageFrom] = useState(initialData.coverageStart);
  const [coverageTo, setCoverageTo] = useState(initialData.coverageEnd);

  const coverageDays = coverageFrom && coverageTo ? daysBetween(coverageFrom, coverageTo) : 0;
  const approxMonths = coverageDays > 0 ? Math.round(coverageDays / 30) || 1 : 0;

  const handlePaymentTypeChange = (type: "monthly" | "bus" | "uniform") => {
    setPaymentType(type);
    if (type === "monthly" && feeConfig?.monthlyFee) {
      setAmount(feeConfig.monthlyFee);
    } else if (type === "bus" && feeConfig?.busFee) {
      setAmount(feeConfig.busFee);
    } else if (type === "uniform") {
      setCoverageFrom("");
      setCoverageTo("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || parseFloat(amount) <= 0) {
      toast.error("يرجى إدخال مبلغ صحيح");
      return;
    }

    if (paymentType !== "uniform" && (!coverageFrom || !coverageTo)) {
      toast.error("يرجى تحديد فترة التغطية");
      return;
    }

    if (paymentType !== "uniform" && coverageTo < coverageFrom) {
      toast.error("تاريخ النهاية يجب أن يكون بعد تاريخ البداية");
      return;
    }

    startTransition(async () => {
      const result = await updatePayment({
        paymentId,
        studentId,
        amount: parseFloat(amount),
        paymentType,
        paymentMethod,
        payerName: payerName || undefined,
        notes: notes || undefined,
        paymentDate,
        coverageStart: paymentType !== "uniform" ? coverageFrom : undefined,
        coverageEnd: paymentType !== "uniform" ? coverageTo : undefined,
      });

      if (result.success) {
        toast.success("تم تحديث الدفعة بنجاح");
        router.push(`/students/${studentId}`);
      } else {
        toast.error(result.error || "فشل في تحديث الدفعة");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Payment Type */}
      <div className="grid gap-2">
        <Label>نوع الدفعة *</Label>
        <Select value={paymentType} onValueChange={(v) => handlePaymentTypeChange(v as "monthly" | "bus" | "uniform")}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="monthly">اشتراك شهري</SelectItem>
            <SelectItem value="bus">رسوم الباص</SelectItem>
            <SelectItem value="uniform">الزي الرسمي</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Amount */}
      <div className="grid gap-2">
        <Label htmlFor="amount">المبلغ (TL) *</Label>
        <Input
          id="amount"
          type="number"
          min="0"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          dir="ltr"
          required
        />
        {feeConfig && paymentType === "monthly" && (
          <p className="text-xs text-zinc-500">الاشتراك المحدد: {feeConfig.monthlyFee} TL</p>
        )}
        {feeConfig?.busFee && paymentType === "bus" && (
          <p className="text-xs text-zinc-500">رسوم الباص المحددة: {feeConfig.busFee} TL</p>
        )}
      </div>

      {/* Payment Date */}
      <div className="grid gap-2">
        <Label htmlFor="paymentDate">تاريخ الدفعة *</Label>
        <Input
          id="paymentDate"
          type="date"
          value={paymentDate}
          onChange={(e) => setPaymentDate(e.target.value)}
          dir="ltr"
          required
        />
      </div>

      {/* Payment Method */}
      <div className="grid gap-2">
        <Label>طريقة الدفع *</Label>
        <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as "cash" | "bank_transfer")}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cash">نقدي</SelectItem>
            <SelectItem value="bank_transfer">تحويل بنكي</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Coverage Date Range */}
      {paymentType !== "uniform" && (
        <div className="grid gap-3">
          <Label>فترة التغطية *</Label>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1">
              <Label htmlFor="coverageFrom" className="text-xs text-zinc-500">من</Label>
              <Input
                id="coverageFrom"
                type="date"
                value={coverageFrom}
                onChange={(e) => setCoverageFrom(e.target.value)}
                dir="ltr"
                required
              />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="coverageTo" className="text-xs text-zinc-500">إلى</Label>
              <Input
                id="coverageTo"
                type="date"
                value={coverageTo}
                onChange={(e) => setCoverageTo(e.target.value)}
                dir="ltr"
                required
              />
            </div>
          </div>
          {coverageDays > 0 && (
            <p className="text-sm text-blue-600">
              مدة التغطية: {coverageDays} يوم (~{approxMonths} شهر)
            </p>
          )}
        </div>
      )}

      {/* Payer Name */}
      <div className="grid gap-2">
        <Label htmlFor="payerName">اسم الدافع</Label>
        <Input
          id="payerName"
          value={payerName}
          onChange={(e) => setPayerName(e.target.value)}
          placeholder="اسم ولي الأمر أو المسؤول"
        />
      </div>

      {/* Notes */}
      <div className="grid gap-2">
        <Label htmlFor="notes">ملاحظات</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="أي ملاحظات إضافية..."
          rows={2}
        />
      </div>

      {/* Submit */}
      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
        >
          إلغاء
        </Button>
        <Button type="submit" disabled={isPending} className="flex-1">
          {isPending && <Loader2 className="h-4 w-4 ms-2 animate-spin" />}
          حفظ التعديلات
        </Button>
      </div>
    </form>
  );
}
