import { db } from "@/db";
import { students, payments, paymentCoverage, feeConfigs, contacts } from "@/db/schema";
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
  DollarSign
} from "lucide-react";
import { getBillingInfo } from "@/lib/billing";

export default async function PaymentsPage() {
  // Fetch all students with their fee configs and coverage status
  const allStudents = await db.select().from(students).orderBy(students.name);
  
  // Fetch all fee configs
  const allFeeConfigs = await db.select().from(feeConfigs);
  
  // Fetch ALL coverage (we need different months per student based on registration date)
  const allCoverage = await db.select().from(paymentCoverage);

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

  // Fetch all contacts for quick dial
  const allContacts = await db.select().from(contacts);

  // Build student payment status using per-student billing cycles
  const studentPaymentMap = new Map<string, {
    student: typeof allStudents[0];
    feeConfig: typeof allFeeConfigs[0] | undefined;
    monthlyCoverage: typeof allCoverage[0] | undefined;
    busCoverage: typeof allCoverage[0] | undefined;
    primaryContact: typeof allContacts[0] | undefined;
    status: "paid" | "partial" | "overdue" | "no-config";
    daysInfo: string;
  }>();

  for (const student of allStudents) {
    const feeConfig = allFeeConfigs.find(fc => fc.studentId === student.id);
    const primaryContact = allContacts.find(
      c => c.studentId === student.id && c.isPrimaryPayer
    ) || allContacts.find(c => c.studentId === student.id);

    let status: "paid" | "partial" | "overdue" | "no-config" = "no-config";
    let monthlyCoverage: typeof allCoverage[0] | undefined;
    let busCoverage: typeof allCoverage[0] | undefined;
    let daysInfo = "";

    if (feeConfig) {
      // Use registration-based billing cycle
      const billing = getBillingInfo(student.registrationDate);
      
      monthlyCoverage = allCoverage.find(
        c => c.studentId === student.id && c.feeType === "monthly" && c.yearMonth === billing.currentDueYearMonth
      );
      busCoverage = allCoverage.find(
        c => c.studentId === student.id && c.feeType === "bus" && c.yearMonth === billing.currentDueYearMonth
      );

      if (monthlyCoverage) {
        if (monthlyCoverage.status === "paid") {
          status = "paid";
          if (billing.daysUntilNextDue > 0) {
            daysInfo = `${billing.daysUntilNextDue} يوم متبقي`;
          }
        } else if (monthlyCoverage.status === "partial") {
          status = "partial";
        } else {
          status = "overdue";
          daysInfo = `متأخر ${billing.daysSinceDue} يوم`;
        }
      } else {
        // No coverage for current due period = overdue
        status = "overdue";
        daysInfo = `متأخر ${billing.daysSinceDue} يوم`;
      }
    }

    studentPaymentMap.set(student.id, {
      student,
      feeConfig,
      monthlyCoverage,
      busCoverage,
      primaryContact,
      status,
      daysInfo,
    });
  }

  const studentsWithConfig = Array.from(studentPaymentMap.values()).filter(s => s.feeConfig);
  const paidStudents = studentsWithConfig.filter(s => s.status === "paid");
  const partialStudents = studentsWithConfig.filter(s => s.status === "partial");
  const overdueStudents = studentsWithConfig.filter(s => s.status === "overdue");
  const blockedStudents = allStudents.filter(s => s.status === "frozen");

  // Calculate totals
  const totalExpected = studentsWithConfig.reduce(
    (sum, s) => sum + parseFloat(s.feeConfig?.monthlyFee || "0"),
    0
  );
  const totalCollected = studentsWithConfig.reduce(
    (sum, s) => sum + parseFloat(s.monthlyCoverage?.amountPaid || "0"),
    0
  );
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
              <p className="text-sm text-zinc-500">المتوقع هذا الشهر</p>
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
            {(overdueStudents.length + partialStudents.length + blockedStudents.length) > 0 && (
              <span className="absolute -top-1 -left-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                {overdueStudents.length + partialStudents.length + blockedStudents.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="overdue">متأخر ({overdueStudents.length})</TabsTrigger>
          <TabsTrigger value="recent">آخر المدفوعات</TabsTrigger>
        </TabsList>

        {/* Needs Attention Tab */}
        <TabsContent value="attention" className="space-y-4">
          {/* Blocked Students */}
          {blockedStudents.length > 0 && (
            <Card className="border-red-300 bg-red-50">
              <CardHeader>
                <CardTitle className="text-base text-red-700">
                  🚫 محظور ({blockedStudents.length})
                </CardTitle>
                <CardDescription className="text-red-600">
                  لاعبين تم تجميد عضويتهم بسبب عدم السداد
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {blockedStudents.map((student) => {
                    const info = studentPaymentMap.get(student.id);
                    return (
                      <div 
                        key={student.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-white"
                      >
                        <div>
                          <Link href={`/students/${student.id}`} className="font-medium hover:underline">
                            {student.name}
                          </Link>
                          <p className="text-sm text-zinc-500">
                            {info?.feeConfig?.monthlyFee || "غير محدد"} TL/شهر
                          </p>
                        </div>
                        {info?.primaryContact?.phone && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={`tel:${info.primaryContact.phone}`}>
                              <Phone className="h-4 w-4 ms-1" />
                              اتصال
                            </a>
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

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
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-sm text-zinc-500">
                            مستحق: {info.feeConfig?.monthlyFee || "0"} TL
                          </p>
                          {info.daysInfo && (
                            <Badge variant="outline" className="text-red-600 border-red-300 text-[10px]">
                              {info.daysInfo}
                            </Badge>
                          )}
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
                    const paid = parseFloat(info.monthlyCoverage?.amountPaid || "0");
                    const due = parseFloat(info.monthlyCoverage?.amountDue || info.feeConfig?.monthlyFee || "0");
                    const remaining = due - paid;
                    
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
                            مدفوع: {paid} TL • متبقي: {remaining} TL
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

          {overdueStudents.length === 0 && partialStudents.length === 0 && blockedStudents.length === 0 && (
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
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-red-600 border-red-300">
                          {info.feeConfig?.monthlyFee || "0"} TL
                        </Badge>
                        {info.daysInfo && (
                          <Badge variant="outline" className="text-orange-600 border-orange-300 text-[10px]">
                            {info.daysInfo}
                          </Badge>
                        )}
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
      </Tabs>
    </div>
  );
}
