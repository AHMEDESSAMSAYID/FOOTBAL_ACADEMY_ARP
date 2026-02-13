import { notFound } from "next/navigation";
import { db } from "@/db";
import { students, feeConfigs } from "@/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PaymentForm } from "./_components/payment-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface PaymentPageProps {
  params: Promise<{ id: string }>;
}

export default async function PaymentPage({ params }: PaymentPageProps) {
  const { id } = await params;
  
  const student = await db.query.students.findFirst({
    where: eq(students.id, id),
  });

  if (!student) {
    notFound();
  }

  const feeConfig = await db.query.feeConfigs.findFirst({
    where: eq(feeConfigs.studentId, id),
  });

  // Fetch siblings
  let siblings: { id: string; name: string; feeConfig?: { monthlyFee: string; busFee: string | null } }[] = [];
  if (student.siblingGroupId) {
    const siblingStudents = await db
      .select({ id: students.id, name: students.name })
      .from(students)
      .where(
        and(
          eq(students.siblingGroupId, student.siblingGroupId),
          ne(students.id, id)
        )
      );
    
    // Fetch fee configs for siblings
    for (const sib of siblingStudents) {
      const sibFee = await db.query.feeConfigs.findFirst({
        where: eq(feeConfigs.studentId, sib.id),
      });
      siblings.push({
        id: sib.id,
        name: sib.name,
        feeConfig: sibFee ? { monthlyFee: sibFee.monthlyFee, busFee: sibFee.busFee } : undefined,
      });
    }
  }

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
          <h1 className="text-2xl font-bold">تسجيل دفعة جديدة</h1>
          <p className="text-sm text-zinc-500">اللاعب: {student.name}</p>
        </div>
      </div>

      <Card className="bg-white max-w-2xl">
        <CardHeader>
          <CardTitle className="text-lg">تفاصيل الدفعة</CardTitle>
          <CardDescription>أدخل بيانات الدفعة لتسجيلها في سجل اللاعب</CardDescription>
        </CardHeader>
        <CardContent>
          <PaymentForm 
            studentId={id} 
            studentName={student.name}
            feeConfig={feeConfig ? {
              monthlyFee: feeConfig.monthlyFee,
              busFee: feeConfig.busFee,
            } : undefined}
            siblings={siblings}
          />
        </CardContent>
      </Card>
    </div>
  );
}
