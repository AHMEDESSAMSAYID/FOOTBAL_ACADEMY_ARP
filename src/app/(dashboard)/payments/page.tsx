import { db } from "@/db";
import { students, payments, feeConfigs, contacts, uniformRecords } from "@/db/schema";
import { eq, desc, sql, and } from "drizzle-orm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  Phone,
  TrendingUp,
  DollarSign,
  Shirt
} from "lucide-react";
import AllPaymentsTab from "./_components/all-payments-tab";
import MonthPicker from "@/components/month-picker";
import { Suspense } from "react";

const MONTH_NAMES = [
  "يناير", "فبراير", "مارس", "أبريل",
  "مايو", "يونيو", "يوليو", "أغسطس",
  "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

function getCurrentYearMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthLabel(ym: string | undefined): string {
  if (!ym) return "هذا الشهر";
  const [y, m] = ym.split("-").map(Number);
  return `${MONTH_NAMES[m - 1]} ${y}`;
}

interface Props {
  searchParams: Promise<{ month?: string }>;
}

export default async function PaymentsPage({ searchParams }: Props) {
  const params = await searchParams;
  const selectedMonth = params.month || undefined;
  const displayMonth = selectedMonth || getCurrentYearMonth();
  // Fetch all students with their fee configs and coverage status
  const allStudents = await db.select().from(students).orderBy(students.name);
  
  // Fetch all fee configs
  const allFeeConfigs = await db.select().from(feeConfigs);

  // Fetch recent payments
  const recentPayments = await db
    .select({
      payment: payments,
      student: students,
    })
    .from(payments)
    .innerJoin(students, eq(payments.studentId, students.id))
    .orderBy(desc(payments.createdAt))
    .limit(20);

  // Fetch ALL payments for the "all" tab
  const allPayments = await db
    .select({
      payment: payments,
      student: students,
    })
    .from(payments)
    .innerJoin(students, eq(payments.studentId, students.id))
    .orderBy(desc(payments.paymentDate));

  // Fetch all contacts for quick dial
  const allContacts = await db.select().from(contacts);

  // Fetch all uniform records
  const allUniformRecords = await db.select().from(uniformRecords);

  // Build per-student uniform status map
  const studentUniformMap = new Map<string, {
    hasRedUniform: boolean;
    hasNavyUniform: boolean;
    unpaidRed: number;
    unpaidNavy: number;
    totalRecords: number;
  }>();

  for (const student of allStudents) {
    const records = allUniformRecords.filter(r => r.studentId === student.id);
    const redRecords = records.filter(r => r.uniformType === "red");
    const navyRecords = records.filter(r => r.uniformType === "navy");
    studentUniformMap.set(student.id, {
      hasRedUniform: redRecords.length > 0,
      hasNavyUniform: navyRecords.length > 0,
      unpaidRed: redRecords.filter(r => !r.isPaid).length,
      unpaidNavy: navyRecords.filter(r => !r.isPaid).length,
      totalRecords: records.length,
    });
  }

  // Unpaid red uniforms for attention tab alert
  const unpaidRedUniforms = allUniformRecords
    .filter(r => r.uniformType === "red" && !r.isPaid)
    .map(r => ({
      uniform: r,
      student: allStudents.find(s => s.id === r.studentId)!,
    }))
    .filter(item => item.student);

  // Unpaid navy uniforms
  const unpaidNavyUniforms = allUniformRecords
    .filter(r => r.uniformType === "navy" && !r.isPaid)
    .map(r => ({
      uniform: r,
      student: allStudents.find(s => s.id === r.studentId)!,
    }))
    .filter(item => item.student);

  // Build student payment status using coverageEnd-based detection
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  // Students with bus subscription not paid for current month
  const busPaymentsByStudent = new Map<string, string[]>();
  for (const row of allPayments) {
    if (row.payment.paymentType === "bus" && row.payment.coverageEnd) {
      const sid = row.payment.studentId;
      if (!busPaymentsByStudent.has(sid)) busPaymentsByStudent.set(sid, []);
      busPaymentsByStudent.get(sid)!.push(row.payment.coverageEnd);
    }
  }

  const unpaidBusStudents = allStudents
    .filter(s => s.status === "active" || s.status === "trial")
    .map(s => {
      const feeConfig = allFeeConfigs.find(fc => fc.studentId === s.id);
      if (!feeConfig || !feeConfig.busFee || parseFloat(feeConfig.busFee) <= 0) return null;
      const busCoverageEnds = busPaymentsByStudent.get(s.id);
      let daysLate = 0;
      let daysInfo = "";
      if (!busCoverageEnds || busCoverageEnds.length === 0) {
        daysInfo = "لا يوجد تغطية";
      } else {
        const maxCoverageEnd = [...busCoverageEnds].sort().pop()!;
        if (maxCoverageEnd >= todayStr) return null; // Still covered
        daysLate = Math.floor(
          (today.getTime() - new Date(maxCoverageEnd + "T00:00:00").getTime()) / (1000 * 60 * 60 * 24)
        );
        daysInfo = `متأخر ${daysLate} يوم`;
      }
      return {
        student: s,
        feeConfig,
        primaryContact: allContacts.find(c => c.studentId === s.id && c.isPrimaryPayer) || allContacts.find(c => c.studentId === s.id),
        daysLate,
        daysInfo,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  // Preload all monthly payments' coverageEnd grouped by student
  const monthlyPaymentsByStudent = new Map<string, string[]>();
  for (const row of allPayments) {
    if (row.payment.paymentType === "monthly" && row.payment.coverageEnd) {
      const sid = row.payment.studentId;
      if (!monthlyPaymentsByStudent.has(sid)) monthlyPaymentsByStudent.set(sid, []);
      monthlyPaymentsByStudent.get(sid)!.push(row.payment.coverageEnd);
    }
  }

  const studentPaymentMap = new Map<string, {
    student: typeof allStudents[0];
    feeConfig: typeof allFeeConfigs[0] | undefined;
    primaryContact: typeof allContacts[0] | undefined;
    status: "paid" | "partial" | "overdue" | "no-config";
    daysInfo: string;
    coveredUntil?: string;
  }>();

  for (const student of allStudents) {
    const feeConfig = allFeeConfigs.find(fc => fc.studentId === student.id);
    const primaryContact = allContacts.find(
      c => c.studentId === student.id && c.isPrimaryPayer
    ) || allContacts.find(c => c.studentId === student.id);

    let status: "paid" | "partial" | "overdue" | "no-config" = "no-config";
    let daysInfo = "";
    let coveredUntil: string | undefined;

    if (feeConfig && (student.status === "active" || student.status === "trial")) {
      const coverageEnds = monthlyPaymentsByStudent.get(student.id);
      if (coverageEnds && coverageEnds.length > 0) {
        const maxCoverageEnd = coverageEnds.sort().pop()!;
        coveredUntil = maxCoverageEnd;
        if (maxCoverageEnd >= todayStr) {
          status = "paid";
          const daysLeft = Math.floor(
            (new Date(maxCoverageEnd + "T00:00:00").getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          );
          if (daysLeft > 0) {
            daysInfo = `${daysLeft} يوم متبقي`;
          }
        } else {
          status = "overdue";
          const daysLate = Math.floor(
            (today.getTime() - new Date(maxCoverageEnd + "T00:00:00").getTime()) / (1000 * 60 * 60 * 24)
          );
          daysInfo = `متأخر ${daysLate} يوم`;
        }
      } else {
        // No monthly payments at all
        status = "overdue";
        daysInfo = "لا يوجد تغطية";
      }
    }

    studentPaymentMap.set(student.id, {
      student,
      feeConfig,
      primaryContact,
      status,
      daysInfo,
      coveredUntil,
    });
  }

  const studentsWithConfig = Array.from(studentPaymentMap.values()).filter(s => s.feeConfig);
  const activeStudentsWithConfig = studentsWithConfig.filter(s => s.student.status === "active" || s.student.status === "trial");
  const paidStudents = studentsWithConfig.filter(s => s.status === "paid");
  const partialStudents = studentsWithConfig.filter(s => s.status === "partial");
  const overdueStudents = studentsWithConfig.filter(s => s.status === "overdue" && s.student.status === "active");

  // Calculate totals - only active + trial students
  const totalExpected = activeStudentsWithConfig.reduce(
    (sum, s) => sum + parseFloat(s.feeConfig?.monthlyFee || "0"),
    0
  );
  // Collected = actual money received in the selected month (by payment date)
  const targetYM = selectedMonth ||
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const totalCollected = allPayments
    .filter(row => {
      const d = new Date(row.payment.paymentDate + "T00:00:00");
      const pYM = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      return pYM === targetYM;
    })
    .reduce((sum, row) => sum + parseFloat(row.payment.amount), 0);
  const collectionRate = totalExpected > 0 
    ? Math.round((totalCollected / totalExpected) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">المدفوعات</h1>
        <Button asChild>
          <Link href="/payments/new">تسجيل دفعة</Link>
        </Button>
      </div>

      {/* Month Picker */}
      <div className="flex justify-center">
        <Suspense>
          <MonthPicker currentMonth={displayMonth} />
        </Suspense>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-700">{paidStudents.length}</p>
                <p className="text-sm text-green-600">مدفوع بالكامل</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-amber-600" />
              <div>
                <p className="text-2xl font-bold text-amber-700">{partialStudents.length}</p>
                <p className="text-sm text-amber-600">مدفوع جزئياً</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-2xl font-bold text-red-700">{overdueStudents.length}</p>
                <p className="text-sm text-red-600">متأخر</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-blue-700">{collectionRate}%</p>
                <p className="text-sm text-blue-600">نسبة التحصيل</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Collection Summary */}
      <Card className="bg-white">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-500">المتوقع - {getMonthLabel(selectedMonth)}</p>
              <p className="text-2xl font-bold">{totalExpected.toLocaleString()} TL</p>
            </div>
            <div className="text-left">
              <p className="text-sm text-zinc-500">المحصّل</p>
              <p className="text-2xl font-bold text-green-600">{totalCollected.toLocaleString()} TL</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="attention" className="space-y-4">
        <TabsList>
          <TabsTrigger value="attention" className="relative">
            يحتاج متابعة
            {(overdueStudents.length + partialStudents.length + unpaidRedUniforms.length + unpaidNavyUniforms.length + unpaidBusStudents.length) > 0 && (
              <span className="absolute -top-1 -left-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                {overdueStudents.length + partialStudents.length + unpaidRedUniforms.length + unpaidNavyUniforms.length + unpaidBusStudents.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="overdue">متأخر ({overdueStudents.length})</TabsTrigger>
          <TabsTrigger value="recent">آخر المدفوعات</TabsTrigger>
          <TabsTrigger value="all">كل المدفوعات ({allPayments.length})</TabsTrigger>
        </TabsList>

        {/* Needs Attention Tab */}
        <TabsContent value="attention" className="space-y-4">
          {/* Overdue Students */}
          {overdueStudents.length > 0 && (
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-base text-red-600">
                  ⚠️ متأخر ({overdueStudents.length})
                </CardTitle>
                <CardDescription>
                  لم يتم سداد اشتراك الفترة الحالية
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {overdueStudents.slice(0, 10).map((info) => (
                    <div 
                      key={info.student.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-zinc-50"
                    >
                      <div>
                        <Link href={`/students/${info.student.id}`} className="font-medium hover:underline">
                          {info.student.name}
                        </Link>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <p className="text-sm text-zinc-500">
                            مستحق: {info.feeConfig?.monthlyFee || "0"} TL
                          </p>
                          {info.daysInfo && (
                            <Badge variant="outline" className="text-red-600 border-red-300 text-[10px]">
                              {info.daysInfo}
                            </Badge>
                          )}
                          {(() => {
                            const uInfo = studentUniformMap.get(info.student.id);
                            if (!uInfo || !uInfo.hasRedUniform) {
                              return (
                                <Badge variant="outline" className="text-zinc-500 border-zinc-300 text-[10px]">
                                  <Shirt className="h-3 w-3 ml-1" />
                                  بدون زي
                                </Badge>
                              );
                            }
                            if (uInfo.unpaidRed > 0) {
                              return (
                                <Badge variant="destructive" className="text-[10px]">
                                  <Shirt className="h-3 w-3 ml-1" />
                                  زي غير مدفوع ({uInfo.unpaidRed})
                                </Badge>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {info.primaryContact?.phone && (
                          <Button variant="ghost" size="sm" asChild>
                            <a href={`tel:${info.primaryContact.phone}`}>
                              <Phone className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        <Button size="sm" asChild>
                          <Link href={`/students/${info.student.id}/payment`}>دفع</Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Partial Students */}
          {partialStudents.length > 0 && (
            <Card className="border-amber-200">
              <CardHeader>
                <CardTitle className="text-base text-amber-600">
                  ⏳ مدفوع جزئياً ({partialStudents.length})
                </CardTitle>
                <CardDescription>
                  تم سداد جزء من الاشتراك
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {partialStudents.map((info) => {
                    return (
                      <div 
                        key={info.student.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-zinc-50"
                      >
                        <div>
                          <Link href={`/students/${info.student.id}`} className="font-medium hover:underline">
                            {info.student.name}
                          </Link>
                          <p className="text-sm text-zinc-500">
                            مستحق: {info.feeConfig?.monthlyFee || "0"} TL
                          </p>
                        </div>
                        <Button size="sm" asChild>
                          <Link href={`/students/${info.student.id}/payment`}>إكمال</Link>
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {unpaidRedUniforms.length > 0 && (
            <Card className="border-red-300 bg-red-50">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Shirt className="h-5 w-5 text-red-600" />
                  <CardTitle className="text-lg text-red-700">
                    زي أحمر غير مدفوع ({unpaidRedUniforms.length})
                  </CardTitle>
                </div>
                <CardDescription className="text-red-600">
                  طلاب لديهم زي أحمر (مطلوب) غير مدفوع
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {unpaidRedUniforms.map((item) => (
                    <div 
                      key={item.uniform.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-white border border-red-200"
                    >
                      <div>
                        <Link href={`/students/${item.student.id}`} className="font-medium hover:underline text-red-700">
                          {item.student.name}
                        </Link>
                        <p className="text-sm text-zinc-500">
                          تاريخ التسليم: {new Date(item.uniform.givenDate).toLocaleDateString("en-GB")}
                          {item.uniform.price && ` • ${item.uniform.price} TL`}
                        </p>
                      </div>
                      <Badge variant="destructive">غير مدفوع</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Unpaid Navy Uniforms */}
          {unpaidNavyUniforms.length > 0 && (
            <Card className="border-blue-300 bg-blue-50">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Shirt className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-lg text-blue-700">
                    زي كحلي غير مدفوع ({unpaidNavyUniforms.length})
                  </CardTitle>
                </div>
                <CardDescription className="text-blue-600">
                  طلاب لديهم زي كحلي غير مدفوع
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {unpaidNavyUniforms.map((item) => (
                    <div 
                      key={item.uniform.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-white border border-blue-200"
                    >
                      <div>
                        <Link href={`/students/${item.student.id}`} className="font-medium hover:underline text-blue-700">
                          {item.student.name}
                        </Link>
                        <p className="text-sm text-zinc-500">
                          تاريخ التسليم: {new Date(item.uniform.givenDate).toLocaleDateString("en-GB")}
                          {item.uniform.price && ` • ${item.uniform.price} TL`}
                        </p>
                      </div>
                      <Badge className="bg-blue-600">غير مدفوع</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Unpaid Bus Subscriptions */}
          {unpaidBusStudents.length > 0 && (
            <Card className="border-orange-300 bg-orange-50">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                  <CardTitle className="text-lg text-orange-700">
                    اشتراك الباص غير مدفوع ({unpaidBusStudents.length})
                  </CardTitle>
                </div>
                <CardDescription className="text-orange-600">
                  طلاب لديهم اشتراك باص غير مدفوع
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {unpaidBusStudents.map((item) => (
                    <div 
                      key={item.student.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-white border border-orange-200"
                    >
                      <div>
                        <Link href={`/students/${item.student.id}`} className="font-medium hover:underline text-orange-700">
                          {item.student.name}
                        </Link>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <p className="text-sm text-zinc-500">
                            رسوم الباص: {item.feeConfig.busFee} TL/شهر
                          </p>
                          {item.daysInfo && (
                            <Badge variant="outline" className="text-orange-600 border-orange-300 text-[10px]">
                              {item.daysInfo}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {item.primaryContact?.phone && (
                          <Button variant="ghost" size="sm" asChild>
                            <a href={`tel:${item.primaryContact.phone}`}>
                              <Phone className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        <Button size="sm" asChild>
                          <Link href={`/students/${item.student.id}/payment`}>دفع</Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {overdueStudents.length === 0 && partialStudents.length === 0 && unpaidRedUniforms.length === 0 && unpaidNavyUniforms.length === 0 && unpaidBusStudents.length === 0 && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="py-8 text-center">
                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <p className="text-green-700 font-medium">كل شيء تمام! 🎉</p>
                <p className="text-sm text-green-600">لا يوجد دفعات متأخرة أو جزئية</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Overdue Tab */}
        <TabsContent value="overdue" className="space-y-4">
          {overdueStudents.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-zinc-500">
                لا يوجد دفعات متأخرة
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="divide-y">
                {overdueStudents.map((info) => (
                  <div 
                    key={info.student.id}
                    className="flex items-center justify-between py-4"
                  >
                    <div>
                      <Link href={`/students/${info.student.id}`} className="font-medium hover:underline">
                        {info.student.name}
                      </Link>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant="outline" className="text-red-600 border-red-300">
                          مستحق: {info.feeConfig?.monthlyFee || "0"} TL
                        </Badge>
                        {info.daysInfo && (
                          <Badge variant="outline" className="text-orange-600 border-orange-300 text-[10px]">
                            {info.daysInfo}
                          </Badge>
                        )}
                        {(() => {
                          const uInfo = studentUniformMap.get(info.student.id);
                          if (!uInfo || !uInfo.hasRedUniform) {
                            return (
                              <Badge variant="outline" className="text-zinc-500 border-zinc-300 text-[10px]">
                                <Shirt className="h-3 w-3 ml-1" />
                                بدون زي
                              </Badge>
                            );
                          }
                          if (uInfo.unpaidRed > 0) {
                            return (
                              <Badge variant="destructive" className="text-[10px]">
                                <Shirt className="h-3 w-3 ml-1" />
                                زي غير مدفوع ({uInfo.unpaidRed})
                              </Badge>
                            );
                          }
                          return (
                            <Badge variant="outline" className="text-green-600 border-green-300 text-[10px]">
                              <Shirt className="h-3 w-3 ml-1" />
                              زي مدفوع
                            </Badge>
                          );
                        })()}
                        {info.primaryContact?.phone && (
                          <span className="text-xs text-zinc-500" dir="ltr">
                            {info.primaryContact.phone}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {info.primaryContact?.phone && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={`tel:${info.primaryContact.phone}`}>
                            <Phone className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      <Button size="sm" asChild>
                        <Link href={`/students/${info.student.id}/payment`}>دفع</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Recent Payments Tab */}
        <TabsContent value="recent" className="space-y-4">
          {recentPayments.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-zinc-500">
                لا يوجد مدفوعات مسجلة
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="divide-y">
                {recentPayments.map(({ payment, student }) => (
                  <div 
                    key={payment.id}
                    className="flex items-center justify-between py-4"
                  >
                    <div>
                      <Link href={`/students/${student.id}`} className="font-medium hover:underline">
                        {student.name}
                      </Link>
                      <p className="text-sm text-zinc-500">
                        {payment.paymentType === "monthly" && "اشتراك شهري"}
                        {payment.paymentType === "bus" && "رسوم الباص"}
                        {payment.paymentType === "uniform" && "الزي الرسمي"}
                        {" • "}
                        {payment.paymentDate}
                      </p>
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-green-600">{payment.amount} TL</p>
                      <p className="text-xs text-zinc-500">
                        {payment.paymentMethod === "cash" ? "نقدي" : "تحويل"}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* All Payments Tab */}
        <TabsContent value="all">
          <AllPaymentsTab payments={allPayments} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
