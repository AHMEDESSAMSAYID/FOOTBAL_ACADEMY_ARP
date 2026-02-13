"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Loader2 } from "lucide-react";
import { deletePayment } from "@/lib/actions/payments";
import { toast } from "sonner";

interface PaymentActionsProps {
  paymentId: string;
  studentId: string;
}

export function PaymentActions({ paymentId, studentId }: PaymentActionsProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("هل أنت متأكد من حذف هذا الدفع؟ سيتم حذف سجلات التغطية المرتبطة أيضاً.")) {
      return;
    }

    setDeleting(true);
    try {
      const result = await deletePayment(paymentId, studentId);
      if (result.success) {
        toast.success("تم حذف الدفع بنجاح");
        router.refresh();
      } else {
        toast.error(result.error || "حدث خطأ أثناء الحذف");
      }
    } catch {
      toast.error("حدث خطأ أثناء الحذف");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
        <Link href={`/students/${studentId}/payment/${paymentId}/edit`}>
          <Pencil className="h-4 w-4" />
        </Link>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
        onClick={handleDelete}
        disabled={deleting}
      >
        {deleting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
