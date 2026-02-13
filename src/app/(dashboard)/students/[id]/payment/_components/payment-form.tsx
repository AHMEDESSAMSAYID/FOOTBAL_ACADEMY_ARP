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
import { recordPayment } from "@/lib/actions/payments";
import { sendPaymentSms } from "@/lib/actions/notifications";
import { toast } from "sonner";
import { Loader2, Check, MessageSquare, Users } from "lucide-react";

interface SiblingInfo {
  id: string;
  name: string;
  feeConfig?: {
    monthlyFee: string;
    busFee: string | null;
  };
}

interface PaymentFormProps {
  studentId: string;
  studentName: string;
  feeConfig?: {
    monthlyFee: string;
    busFee: string | null;
  };
  siblings?: SiblingInfo[];
}

// Generate months for the next 12 months
function generateMonths(): { value: string; label: string }[] {
  const months = [];
  const now = new Date();
  const arabicMonths = [
    "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
    "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
  ];
  
  for (let i = -2; i < 12; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const label = `${arabicMonths[date.getMonth()]} ${date.getFullYear()}`;
    months.push({ value, label });
  }
  
  return months;
}

export function PaymentForm({ studentId, studentName, feeConfig, siblings = [] }: PaymentFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  
  const [paymentType, setPaymentType] = useState<"monthly" | "bus" | "uniform">("monthly");
  const [amount, setAmount] = useState(feeConfig?.monthlyFee || "");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "bank_transfer">("cash");
  const [payerName, setPayerName] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [sendSmsNotification, setSendSmsNotification] = useState(false);
  const [alsoPayForSiblings, setAlsoPayForSiblings] = useState<string[]>([]);
  
  const months = generateMonths();

  // Update amount when payment type changes
  const handlePaymentTypeChange = (type: "monthly" | "bus" | "uniform") => {
    setPaymentType(type);
    if (type === "monthly" && feeConfig?.monthlyFee) {
      setAmount(feeConfig.monthlyFee);
    } else if (type === "bus" && feeConfig?.busFee) {
      setAmount(feeConfig.busFee);
    } else {
      setAmount("");
    }
    // Clear months for uniform since it's a one-time payment
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
      const result = await recordPayment({
        studentId,
        amount: parseFloat(amount),
        paymentType,
        paymentMethod,
        payerName: payerName || undefined,
        notes: notes || undefined,
        paymentDate: new Date().toISOString().split("T")[0],
        monthsCovered: paymentType !== "uniform" ? selectedMonths : undefined,
      });

      if (result.success) {
        toast.success(`تم تسجيل الدفعة لـ ${studentName}`);
        
        // Also record for selected siblings
        for (const sibId of alsoPayForSiblings) {
          const sib = siblings.find((s) => s.id === sibId);
          if (!sib) continue;
          
          // Use sibling's own fee config for amount, or same amount
          let sibAmount = parseFloat(amount);
          if (sib.feeConfig) {
            if (paymentType === "monthly") sibAmount = parseFloat(sib.feeConfig.monthlyFee);
            else if (paymentType === "bus" && sib.feeConfig.busFee) sibAmount = parseFloat(sib.feeConfig.busFee);
          }
          
          const sibResult = await recordPayment({
            studentId: sibId,
            amount: sibAmount,
            paymentType,
            paymentMethod,
            payerName: payerName || undefined,
            notes: notes ? `${notes} (دفعة مشتركة مع ${studentName})` : `دفعة مشتركة مع ${studentName}`,
            paymentDate: new Date().toISOString().split("T")[0],
            monthsCovered: paymentType !== "uniform" ? selectedMonths : undefined,
          });
          if (sibResult.success) {
            toast.success(`تم تسجيل الدفعة لـ ${sib.name}`);
          } else {
            toast.error(`فشل تسجيل الدفعة لـ ${sib.name}`);
          }
        }
        
        // Send SMS notification if opted in
        if (sendSmsNotification) {
          const smsResult = await sendPaymentSms(
            studentId,
            studentName,
            parseFloat(amount),
            paymentType
          );
          if (smsResult.success) {
            toast.success("تم إرسال إشعار SMS لولي الأمر");
          } else {
            toast.error(smsResult.error || "فشل في إرسال الإشعار");
          }
        }
        
        router.push(`/students/${studentId}`);
      } else {
        toast.error(result.error || "فشل في تسجيل الدفعة");
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
        <Label htmlFor="amount">المبلغ (ج.م) *</Label>
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
          <p className="text-xs text-zinc-500">الاشتراك المحدد: {feeConfig.monthlyFee} ج.م</p>
        )}
        {feeConfig?.busFee && paymentType === "bus" && (
          <p className="text-xs text-zinc-500">رسوم الباص المحددة: {feeConfig.busFee} ج.م</p>
        )}
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
            {months.map((month) => {
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
              المبلغ لكل شهر: {(parseFloat(amount || "0") / selectedMonths.length).toFixed(2)} ج.م
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

      {/* Also Pay For Siblings */}
      {siblings.length > 0 && (
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Users className="h-4 w-4 text-violet-600" />
            تسجيل نفس الدفعة للأخوة
          </Label>
          <p className="text-xs text-zinc-500">
            سيتم تسجيل دفعة منفصلة لكل أخ بنفس الأشهر المختارة
          </p>
          <div className="space-y-2">
            {siblings.map((sib) => {
              const isSelected = alsoPayForSiblings.includes(sib.id);
              const sibFee = sib.feeConfig
                ? paymentType === "monthly" ? sib.feeConfig.monthlyFee
                : paymentType === "bus" && sib.feeConfig.busFee ? sib.feeConfig.busFee
                : amount
                : amount;
              return (
                <div
                  key={sib.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? "border-violet-300 bg-violet-50 shadow-sm"
                      : "border-zinc-200 hover:border-violet-200 hover:bg-violet-50/50"
                  }`}
                  onClick={() => {
                    setAlsoPayForSiblings((prev) =>
                      prev.includes(sib.id)
                        ? prev.filter((id) => id !== sib.id)
                        : [...prev, sib.id]
                    );
                  }}
                >
                  <div className={`flex items-center justify-center h-5 w-5 shrink-0 rounded-sm border ${
                    isSelected ? "bg-violet-600 border-violet-600 text-white" : "border-zinc-300"
                  }`}>
                    {isSelected && <Check className="h-3 w-3" />}
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-200 text-violet-700 text-xs font-bold">
                    {sib.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{sib.name}</p>
                    {sib.feeConfig && (
                      <p className="text-xs text-zinc-500">
                        الاشتراك: {sibFee} ج.م
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {alsoPayForSiblings.length > 0 && selectedMonths.length > 0 && (
            <div className="p-3 rounded-lg bg-violet-100 border border-violet-200">
              <p className="text-sm text-violet-800 font-medium">
                ملخص: سيتم تسجيل {alsoPayForSiblings.length + 1} دفعات ({studentName} + {alsoPayForSiblings.length} أخوة) × {selectedMonths.length} أشهر
              </p>
            </div>
          )}
        </div>
      )}

      {/* SMS Notification Option */}
      <div
        className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors hover:bg-blue-50"
        onClick={() => setSendSmsNotification(!sendSmsNotification)}
      >
        <div className={`flex items-center justify-center h-5 w-5 shrink-0 rounded-sm border ${
          sendSmsNotification ? "bg-blue-600 border-blue-600 text-white" : "border-zinc-300"
        }`}>
          {sendSmsNotification && <Check className="h-3 w-3" />}
        </div>
        <MessageSquare className="h-4 w-4 text-blue-600" />
        <span className="text-sm">إرسال إشعار SMS لولي الأمر</span>
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
          تسجيل الدفعة
        </Button>
      </div>
    </form>
  );
}
