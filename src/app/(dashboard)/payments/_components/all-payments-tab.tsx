"use client";

import { useState, useTransition, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { updatePaymentQuick } from "@/lib/actions/payments";
import { toast } from "sonner";
import {
  Pencil,
  X,
  Check,
  Loader2,
  Search,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Link from "next/link";

interface Payment {
  id: string;
  studentId: string;
  amount: string;
  paymentType: "monthly" | "bus" | "uniform";
  paymentMethod: "cash" | "bank_transfer";
  payerName: string | null;
  notes: string | null;
  paymentDate: string | null;
  createdAt: Date | null;
  coverageStart: string | null;
  coverageEnd: string | null;
  monthsCovered: number | null;
}

interface Student {
  id: string;
  name: string;
}

interface AllPaymentsTabProps {
  payments: { payment: Payment; student: Student }[];
}

const TYPE_LABELS: Record<string, string> = {
  monthly: "شهري",
  bus: "باص",
  uniform: "زي",
};

const METHOD_LABELS: Record<string, string> = {
  cash: "نقدي",
  bank_transfer: "تحويل",
};

export default function AllPaymentsTab({ payments }: AllPaymentsTabProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Edit form state
  const [editForm, setEditForm] = useState({
    amount: "",
    paymentType: "" as "monthly" | "bus" | "uniform",
    paymentMethod: "" as "cash" | "bank_transfer",
    payerName: "",
    notes: "",
    paymentDate: "",
  });

  // Filter & search
  const filtered = useMemo(() => {
    return payments.filter(({ payment, student }) => {
      const matchesSearch =
        !search ||
        student.name.includes(search) ||
        payment.amount.includes(search) ||
        (payment.payerName && payment.payerName.includes(search)) ||
        (payment.notes && payment.notes.includes(search));

      const matchesType =
        typeFilter === "all" || payment.paymentType === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [payments, search, typeFilter]);

  // Total for filtered
  const filteredTotal = useMemo(
    () => filtered.reduce((s, { payment }) => s + parseFloat(payment.amount), 0),
    [filtered]
  );

  function startEdit(p: Payment) {
    setEditingId(p.id);
    setEditForm({
      amount: p.amount,
      paymentType: p.paymentType,
      paymentMethod: p.paymentMethod,
      payerName: p.payerName || "",
      notes: p.notes || "",
      paymentDate: p.paymentDate || "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
  }

  function saveEdit(paymentId: string, studentId: string) {
    startTransition(async () => {
      const result = await updatePaymentQuick({
        paymentId,
        studentId,
        amount: parseFloat(editForm.amount),
        paymentType: editForm.paymentType,
        paymentMethod: editForm.paymentMethod,
        payerName: editForm.payerName || undefined,
        notes: editForm.notes || undefined,
        paymentDate: editForm.paymentDate,
      });

      if (result.success) {
        toast.success("تم تحديث الدفعة بنجاح");
        setEditingId(null);
      } else {
        toast.error(result.error || "فشل في التحديث");
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Search and filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="بحث بالاسم، المبلغ، الملاحظات..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="نوع الدفعة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل</SelectItem>
            <SelectItem value="monthly">شهري</SelectItem>
            <SelectItem value="bus">باص</SelectItem>
            <SelectItem value="uniform">زي</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between text-sm text-zinc-500">
        <span>
          عرض {filtered.length} من {payments.length} دفعة
        </span>
        <span className="font-medium text-zinc-700">
          المجموع: {filteredTotal.toLocaleString()} TL
        </span>
      </div>

      {/* Payments list */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-zinc-500">
            لا توجد نتائج
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="divide-y p-0">
            {filtered.map(({ payment, student }) => {
              const isEditing = editingId === payment.id;
              const isExpanded = expandedId === payment.id;

              return (
                <div key={payment.id} className="px-4 py-3">
                  {/* Row – always visible */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/students/${student.id}`}
                          className="font-medium hover:underline truncate"
                        >
                          {student.name}
                        </Link>
                        <Badge
                          variant="outline"
                          className={
                            payment.paymentType === "monthly"
                              ? "border-blue-300 text-blue-600"
                              : payment.paymentType === "bus"
                              ? "border-amber-300 text-amber-600"
                              : "border-purple-300 text-purple-600"
                          }
                        >
                          {TYPE_LABELS[payment.paymentType]}
                        </Badge>
                      </div>
                      <p className="text-sm text-zinc-500 mt-0.5">
                        {payment.paymentDate || "—"} •{" "}
                        {METHOD_LABELS[payment.paymentMethod]}
                        {payment.payerName && ` • ${payment.payerName}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-green-600 whitespace-nowrap">
                        {parseFloat(payment.amount).toLocaleString()} TL
                      </span>
                      {!isEditing && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              setExpandedId(
                                isExpanded ? null : payment.id
                              )
                            }
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-blue-600"
                            onClick={() => {
                              startEdit(payment);
                              setExpandedId(null);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && !isEditing && (
                    <div className="mt-3 p-3 bg-zinc-50 rounded-lg text-sm space-y-1">
                      {payment.coverageStart && (
                        <p>
                          <span className="text-zinc-500">تغطية: </span>
                          {payment.coverageStart} → {payment.coverageEnd}
                          {payment.monthsCovered &&
                            ` (${payment.monthsCovered} شهر)`}
                        </p>
                      )}
                      {payment.notes && (
                        <p>
                          <span className="text-zinc-500">ملاحظات: </span>
                          {payment.notes}
                        </p>
                      )}
                      {!payment.notes && !payment.coverageStart && (
                        <p className="text-zinc-400">لا توجد تفاصيل إضافية</p>
                      )}
                    </div>
                  )}

                  {/* Inline edit form */}
                  {isEditing && (
                    <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        {/* Amount */}
                        <div>
                          <label className="text-xs text-zinc-500 mb-1 block">
                            المبلغ
                          </label>
                          <Input
                            type="number"
                            value={editForm.amount}
                            onChange={(e) =>
                              setEditForm({ ...editForm, amount: e.target.value })
                            }
                          />
                        </div>

                        {/* Payment Date */}
                        <div>
                          <label className="text-xs text-zinc-500 mb-1 block">
                            تاريخ الدفع
                          </label>
                          <Input
                            type="date"
                            value={editForm.paymentDate}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                paymentDate: e.target.value,
                              })
                            }
                          />
                        </div>

                        {/* Payment Type */}
                        <div>
                          <label className="text-xs text-zinc-500 mb-1 block">
                            نوع الدفعة
                          </label>
                          <Select
                            value={editForm.paymentType}
                            onValueChange={(v) =>
                              setEditForm({
                                ...editForm,
                                paymentType: v as "monthly" | "bus" | "uniform",
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="monthly">شهري</SelectItem>
                              <SelectItem value="bus">باص</SelectItem>
                              <SelectItem value="uniform">زي</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Payment Method */}
                        <div>
                          <label className="text-xs text-zinc-500 mb-1 block">
                            طريقة الدفع
                          </label>
                          <Select
                            value={editForm.paymentMethod}
                            onValueChange={(v) =>
                              setEditForm({
                                ...editForm,
                                paymentMethod: v as "cash" | "bank_transfer",
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cash">نقدي</SelectItem>
                              <SelectItem value="bank_transfer">تحويل</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Payer Name */}
                      <div>
                        <label className="text-xs text-zinc-500 mb-1 block">
                          اسم الدافع
                        </label>
                        <Input
                          value={editForm.payerName}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              payerName: e.target.value,
                            })
                          }
                          placeholder="اختياري"
                        />
                      </div>

                      {/* Notes */}
                      <div>
                        <label className="text-xs text-zinc-500 mb-1 block">
                          ملاحظات
                        </label>
                        <Textarea
                          value={editForm.notes}
                          onChange={(e) =>
                            setEditForm({ ...editForm, notes: e.target.value })
                          }
                          placeholder="اختياري"
                          rows={2}
                        />
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={cancelEdit}
                          disabled={isPending}
                        >
                          <X className="h-4 w-4 ml-1" />
                          إلغاء
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => saveEdit(payment.id, student.id)}
                          disabled={isPending}
                        >
                          {isPending ? (
                            <Loader2 className="h-4 w-4 ml-1 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4 ml-1" />
                          )}
                          حفظ
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
