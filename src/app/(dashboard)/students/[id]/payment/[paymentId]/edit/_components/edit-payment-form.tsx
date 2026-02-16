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
import { Loader2, Check } from "lucide-react";

interface EditPaymentFormProps {
  studentId: string;
  studentName: string;
  paymentId: string;
  registrationDate: string;
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
    coveredMonths: string[];
  };
}

// Generate billing-cycle periods based on student registration date
function generateBillingPeriods(registrationDate: string): { value: string; label: string }[] {
  const regDate = new Date(registrationDate + "T00:00:00");
  const billingDay = regDate.getDate();
  const periods: { value: string; label: string }[] = [];

  // Wider range for editing old payments
  for (let i = -6; i < 12; i++) {
    const startMonth = new Date(regDate.getFullYear(), regDate.getMonth() + i, 1);
    const daysInStart = new Date(startMonth.getFullYear(), startMonth.getMonth() + 1, 0).getDate();
    const effectiveStart = Math.min(billingDay, daysInStart);
    const start = new Date(startMonth.getFullYear(), startMonth.getMonth(), effectiveStart);

    const nextMonth = new Date(regDate.getFullYear(), regDate.getMonth() + i + 1, 1);
    const daysInNext = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).getDate();
    const effectiveNext = Math.min(billingDay, daysInNext);
    const end = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), effectiveNext - 1);

    const value = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`;
    const label = `${start.getDate()}/${start.getMonth() + 1} - ${end.getDate()}/${end.getMonth() + 1}`;
    periods.push({ value, label });
  }

  return periods;
}

export function EditPaymentForm({
  studentId,
  studentName,
  paymentId,
  registrationDate,
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
  const [selectedMonths, setSelectedMonths] = useState<string[]>(initialData.coveredMonths);

  const months = generateBillingPeriods(registrationDate);

  // Also add any covered months from initialData that aren't in the range
  const allMonths = [...months];
  for (const ym of initialData.coveredMonths) {
    if (!allMonths.find((m) => m.value === ym)) {
      // Generate the label for this period based on registration date
      const regDate = new Date(registrationDate + "T00:00:00");
      const billingDay = regDate.getDate();
      const [y, mo] = ym.split("-").map(Number);
      const startMonth = new Date(y, mo - 1, 1);
      const daysInStart = new Date(startMonth.getFullYear(), startMonth.getMonth() + 1, 0).getDate();
      const effectiveStart = Math.min(billingDay, daysInStart);
      const start = new Date(startMonth.getFullYear(), startMonth.getMonth(), effectiveStart);
      const nextMonth = new Date(y, mo, 1);
      const daysInNext = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).getDate();
      const effectiveNext = Math.min(billingDay, daysInNext);
      const end = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), effectiveNext - 1);
      const label = `${start.getDate()}/${start.getMonth() + 1} - ${end.getDate()}/${end.getMonth() + 1}`;
      allMonths.push({ value: ym, label });
    }
  }
  allMonths.sort((a, b) => a.value.localeCompare(b.value));

  const handlePaymentTypeChange = (type: "monthly" | "bus" | "uniform") => {
    setPaymentType(type);
    if (type === "uniform") {
      setSelectedMonths([]);
    }
  };

  const handleMonthToggle = (yearMonth: string) => {
    setSelectedMonths((prev) =>
      prev.includes(yearMonth)
        ? prev.filter((m) => m !== yearMonth)
        : [...prev, yearMonth].sort()
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || parseFloat(amount) <= 0) {
      toast.error("يرجى إدخال مبلغ صحيح");
      return;
    }

    if (paymentType !== "uniform" && selectedMonths.length === 0) {
      toast.error("يرجى اختيار شهر واحد على الأقل");
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
        monthsCovered: paymentType !== "uniform" ? selectedMonths : undefined,
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

      {/* Months Covered */}
      {paymentType !== "uniform" && (
        <div className="grid gap-3">
          <Label>الأشهر المغطاة *</Label>
          <p className="text-xs text-zinc-500">اختر الأشهر التي تغطيها هذه الدفعة</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {allMonths.map((month) => {
              const isSelected = selectedMonths.includes(month.value);
              return (
                <button
                  type="button"
                  key={month.value}
                  className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors text-start ${
                    isSelected
                      ? "bg-blue-50 border-blue-300"
                      : "bg-white hover:bg-zinc-50"
                  }`}
                  onClick={() => handleMonthToggle(month.value)}
                >
                  <div className={`flex items-center justify-center h-4 w-4 shrink-0 rounded-sm border ${
                    isSelected ? "bg-primary border-primary text-primary-foreground" : "border-zinc-300"
                  }`}>
                    {isSelected && <Check className="h-3 w-3" />}
                  </div>
                  <span className="text-sm">{month.label}</span>
                </button>
              );
            })}
          </div>
          {selectedMonths.length > 0 && (
            <p className="text-sm text-blue-600">
              عدد الأشهر: {selectedMonths.length} •
              المبلغ لكل شهر: {(parseFloat(amount || "0") / selectedMonths.length).toFixed(2)} TL
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
