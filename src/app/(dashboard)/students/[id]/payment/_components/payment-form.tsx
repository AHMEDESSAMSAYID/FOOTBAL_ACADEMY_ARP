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
  registrationDate: string;
  lastCoverageEnd: string | null;
  feeConfig?: {
    monthlyFee: string;
    busFee: string | null;
  };
  siblings?: SiblingInfo[];
}

/** Add days to YYYY-MM-DD string and return YYYY-MM-DD */
function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

/** Calculate inclusive days between two YYYY-MM-DD strings */
function daysBetween(from: string, to: string): number {
  const a = new Date(from + "T00:00:00");
  const b = new Date(to + "T00:00:00");
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

export function PaymentForm({ studentId, studentName, registrationDate, lastCoverageEnd, feeConfig, siblings = [] }: PaymentFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  
  const [paymentType, setPaymentType] = useState<"monthly" | "bus" | "uniform">("monthly");
  const [amount, setAmount] = useState(feeConfig?.monthlyFee || "");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "bank_transfer">("cash");
  const [payerName, setPayerName] = useState("");
  const [notes, setNotes] = useState("");
  const [sendSmsNotification, setSendSmsNotification] = useState(false);
  const [alsoPayForSiblings, setAlsoPayForSiblings] = useState<string[]>([]);

  // Coverage date range
  const defaultFrom = lastCoverageEnd ? addDays(lastCoverageEnd, 1) : registrationDate;
  const defaultTo = addDays(defaultFrom, 29);
  const [coverageFrom, setCoverageFrom] = useState(defaultFrom);
  const [coverageTo, setCoverageTo] = useState(defaultTo);

  const coverageDays = coverageFrom && coverageTo ? daysBetween(coverageFrom, coverageTo) : 0;
  const approxMonths = coverageDays > 0 ? Math.round(coverageDays / 30) || 1 : 0;

  const handlePaymentTypeChange = (type: "monthly" | "bus" | "uniform") => {
    setPaymentType(type);
    if (type === "monthly" && feeConfig?.monthlyFee) {
      setAmount(feeConfig.monthlyFee);
    } else if (type === "bus" && feeConfig?.busFee) {
      setAmount(feeConfig.busFee);
    } else {
      setAmount("");
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
      const result = await recordPayment({
        studentId,
        amount: parseFloat(amount),
        paymentType,
        paymentMethod,
        payerName: payerName || undefined,
        notes: notes || undefined,
        paymentDate: new Date().toISOString().split("T")[0],
        coverageStart: paymentType !== "uniform" ? coverageFrom : undefined,
        coverageEnd: paymentType !== "uniform" ? coverageTo : undefined,
      });

      if (result.success) {
        toast.success(`تم تسجيل الدفعة لـ ${studentName}`);
        
        // Also record for selected siblings
        for (const sibId of alsoPayForSiblings) {
          const sib = siblings.find((s) => s.id === sibId);
          if (!sib) continue;
          
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
            coverageStart: paymentType !== "uniform" ? coverageFrom : undefined,
            coverageEnd: paymentType !== "uniform" ? coverageTo : undefined,
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
          {lastCoverageEnd && (
            <p className="text-xs text-zinc-500">
              آخر تغطية حتى: {lastCoverageEnd}
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
            سيتم تسجيل دفعة منفصلة لكل أخ بنفس فترة التغطية
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
                        الاشتراك: {sibFee} TL
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {alsoPayForSiblings.length > 0 && coverageDays > 0 && (
            <div className="p-3 rounded-lg bg-violet-100 border border-violet-200">
              <p className="text-sm text-violet-800 font-medium">
                ملخص: سيتم تسجيل {alsoPayForSiblings.length + 1} دفعات ({studentName} + {alsoPayForSiblings.length} أخوة)
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
