import { notFound } from "next/navigation";
import { db } from "@/db";
import { students, feeConfigs, payments, paymentCoverage } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { EditPaymentForm } from "./_components/edit-payment-form";

interface EditPaymentPageProps {
  params: Promise<{ id: string; paymentId: string }>;
}

export default async function EditPaymentPage({ params }: EditPaymentPageProps) {
  const { id, paymentId } = await params;

  const student = await db.query.students.findFirst({
    where: eq(students.id, id),
  });

  if (!student) notFound();

  const payment = await db.query.payments.findFirst({
    where: eq(payments.id, paymentId),
  });

  if (!payment) notFound();

  const feeConfig = await db.query.feeConfigs.findFirst({
    where: eq(feeConfigs.studentId, id),
  });

  // Get linked coverage months
  const coverage = await db
    .select()
    .from(paymentCoverage)
    .where(eq(paymentCoverage.paymentId, paymentId));

  const coveredMonths = coverage.map((c) => c.yearMonth).sort();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/students/${id}`}>
            <ArrowRight className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">تعديل الدفعة</h1>
          <p className="text-sm text-zinc-500">اللاعب: {student.name}</p>
        </div>
      </div>

      <Card className="bg-white max-w-2xl">
        <CardHeader>
          <CardTitle className="text-lg">تعديل تفاصيل الدفعة</CardTitle>
          <CardDescription>عدّل بيانات الدفعة والأشهر المغطاة</CardDescription>
        </CardHeader>
        <CardContent>
          <EditPaymentForm
            studentId={id}
            studentName={student.name}
            paymentId={paymentId}
            registrationDate={student.registrationDate}
            feeConfig={feeConfig ? {
              monthlyFee: feeConfig.monthlyFee,
              busFee: feeConfig.busFee,
            } : undefined}
            initialData={{
              amount: payment.amount,
              paymentType: payment.paymentType as "monthly" | "bus" | "uniform",
              paymentMethod: payment.paymentMethod as "cash" | "bank_transfer",
              payerName: payment.payerName,
              notes: payment.notes,
              paymentDate: payment.paymentDate,
              coveredMonths,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
