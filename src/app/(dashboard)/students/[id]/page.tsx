import { notFound } from "next/navigation";
import { db } from "@/db";
import { students, contacts, payments, feeConfigs, uniformRecords } from "@/db/schema";
import { eq, desc, and, ne } from "drizzle-orm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ContactsList } from "./_components/contacts-list";
import { AddContactDialog } from "./_components/add-contact-dialog";
import { StatusSelector } from "./_components/status-selector";
import { AgeGroupSelector } from "./_components/age-group-selector";
import { NotesEditor } from "./_components/notes-editor";
import { FeeConfigDialog } from "./_components/fee-config-dialog";
import { PaymentCoverageCalendar } from "./_components/payment-coverage-calendar";
import { AttendanceHistory } from "./_components/attendance-history";
import { EvaluationsTab } from "./_components/evaluations-tab";
import { EscalationHistory } from "./_components/escalation-history";
import { PaymentActions } from "./_components/payment-actions";
import { SiblingsPanel } from "./_components/siblings-panel";
import { UniformRecords } from "./_components/uniform-records";

interface StudentPageProps {
  params: Promise<{ id: string }>;
}

const ageGroupLabels: Record<string, string> = {
  "5-10": "تحت ١٠ سنوات",
  "10-15": "١٠-١٥ سنة",
  "15+": "فوق ١٥ سنة",
};

export default async function StudentPage({ params }: StudentPageProps) {
  const { id } = await params;
  
  // Fetch student with related data
  const student = await db.query.students.findFirst({
    where: eq(students.id, id),
  });

  if (!student) {
    notFound();
  }

  // Fetch contacts separately
  const studentContacts = await db.select().from(contacts).where(eq(contacts.studentId, id));
  
  // Fetch fee config
  const studentFeeConfig = await db.select().from(feeConfigs).where(eq(feeConfigs.studentId, id));
  
  // Fetch uniform records
  const studentUniformRecords = await db.select()
    .from(uniformRecords)
    .where(eq(uniformRecords.studentId, id))
    .orderBy(desc(uniformRecords.givenDate));
  
  // Fetch all payments
  const studentPayments = await db.select()
    .from(payments)
    .where(eq(payments.studentId, id))
    .orderBy(desc(payments.paymentDate));

  // Fetch siblings and their payments
  let siblingPaymentsData: { siblingName: string; siblingId: string; payments: typeof studentPayments }[] = [];
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

    for (const sib of siblingStudents) {
      const sibPayments = await db.select()
        .from(payments)
        .where(eq(payments.studentId, sib.id))
        .orderBy(desc(payments.paymentDate));
      siblingPaymentsData.push({
        siblingName: sib.name,
        siblingId: sib.id,
        payments: sibPayments,
      });
    }
  }

  // Calculate age from birthDate
  const calculateAge = (birthDate: string | null): string | null => {
    if (!birthDate) return null;
    const birth = new Date(birthDate);
    const today = new Date();
    let years = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      years--;
    }
    return `${years} سنة`;
  };

  const age = calculateAge(student.birthDate);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-zinc-100 text-xl sm:text-2xl font-bold">
            {student.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{student.name}</h1>
              {student.membershipNumber && (
                <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-600/20 ring-inset">
                  {student.membershipNumber}
                </span>
              )}
              <StatusSelector 
                studentId={id} 
                currentStatus={student.status as "active" | "inactive" | "frozen" | "trial"} 
              />
            </div>
            <p className="text-sm text-zinc-500">
              {age && `العمر: ${age}`}
              {age && student.ageGroup && " • "}
              {student.ageGroup && ageGroupLabels[student.ageGroup]}
            </p>
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" asChild className="flex-1 sm:flex-none">
            <Link href={`/students/${id}/edit`}>تعديل</Link>
          </Button>
          <Button asChild className="flex-1 sm:flex-none">
            <Link href={`/students/${id}/payment`}>تسجيل دفعة</Link>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="w-full overflow-x-auto flex-nowrap justify-start">
          <TabsTrigger value="profile">الملف الشخصي</TabsTrigger>
          <TabsTrigger value="contacts">جهات الاتصال ({studentContacts.length})</TabsTrigger>
          <TabsTrigger value="payments">المدفوعات</TabsTrigger>
          <TabsTrigger value="attendance">الحضور</TabsTrigger>
          <TabsTrigger value="evaluations">التقييمات</TabsTrigger>
          <TabsTrigger value="escalation">التصعيد</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-base">البيانات الشخصية</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500">الاسم الكامل</span>
                  <span>{student.fullName || student.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">تاريخ الميلاد</span>
                  <span>
                    {student.birthDate || "غير محدد"}
                    {age && <span className="text-zinc-400 mr-2">({age})</span>}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">الجنسية</span>
                  <span>{student.nationality || "غير محدد"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">رقم الهوية</span>
                  <span dir="ltr">{student.idNumber || "غير محدد"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">المدرسة</span>
                  <span>{student.school || "غير محدد"}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-base">معلومات التسجيل</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500">رمز اللاعب</span>
                  <span className="font-medium">{student.membershipNumber || "غير محدد"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">تاريخ التسجيل</span>
                  <span>{student.registrationDate}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">الفئة العمرية</span>
                  <AgeGroupSelector 
                    studentId={id} 
                    currentAgeGroup={student.ageGroup as "5-10" | "10-15" | "15+" | null} 
                  />
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">المنطقة</span>
                  <span>{student.area || "غير محدد"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">العنوان</span>
                  <span>{student.address || "غير محدد"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">الهاتف</span>
                  <span dir="ltr">{student.phone || "غير محدد"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">استمارة التسجيل</span>
                  <Badge className={student.registrationFormStatus === "filled" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                    {student.registrationFormStatus === "filled" ? "مكتمل  A" : "غير مكتمل A "}
                  </Badge>
                </div>
                {student.registrationFormNotes && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">ملاحظات الاستمارة</span>
                    <span className="text-sm text-amber-600">{student.registrationFormNotes}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <NotesEditor studentId={id} initialNotes={student.notes} />

            {/* Siblings Card */}
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  👨‍👦‍👦 الأخوة
                </CardTitle>
                <CardDescription>ربط اللاعبين الأخوة لتسهيل إدارة المدفوعات</CardDescription>
              </CardHeader>
              <CardContent>
                <SiblingsPanel studentId={id} />
              </CardContent>
            </Card>

            <Card className="bg-white md:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">الاشتراك والرسوم</CardTitle>
                <FeeConfigDialog 
                  studentId={id} 
                  existingConfig={studentFeeConfig.length > 0 ? studentFeeConfig[0] : undefined} 
                />
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {studentFeeConfig.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-zinc-500">الاشتراك الشهري</p>
                      <p className="font-medium">{studentFeeConfig[0].monthlyFee} TL</p>
                    </div>
                    {studentFeeConfig[0].busFee && (
                      <div>
                        <p className="text-zinc-500">رسوم الباص</p>
                        <p className="font-medium">{studentFeeConfig[0].busFee} TL</p>
                      </div>
                    )}
                    {studentFeeConfig[0].discountType && (
                      <div>
                        <p className="text-zinc-500">الخصم</p>
                        <p className="font-medium">
                          {studentFeeConfig[0].discountAmount} 
                          {studentFeeConfig[0].discountType === "percentage" ? "%" : " TL"}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4 text-zinc-500">
                    لم يتم تكوين الرسوم لهذا اللاعب بعد
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Contacts Tab */}
        <TabsContent value="contacts" className="space-y-4">
          <Card className="bg-white">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">جهات الاتصال</CardTitle>
                <CardDescription>أولياء الأمور والمسؤولين عن اللاعب</CardDescription>
              </div>
              <AddContactDialog studentId={id} />
            </CardHeader>
            <CardContent>
              <ContactsList contacts={studentContacts} studentId={id} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-4">
          {/* Coverage Calendar */}
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-base">تغطية المدفوعات</CardTitle>
              <CardDescription>حالة الدفع لكل شهر</CardDescription>
            </CardHeader>
            <CardContent>
              <PaymentCoverageCalendar studentId={id} />
            </CardContent>
          </Card>

          {/* Uniform Records */}
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-base">سجلات الزي الرسمي</CardTitle>
              <CardDescription>تتبع تسليم ودفع الأزياء الرسمية</CardDescription>
            </CardHeader>
            <CardContent>
              <UniformRecords
                studentId={id}
                records={studentUniformRecords as any}
              />
            </CardContent>
          </Card>

          {/* Payment History */}
          <Card className="bg-white">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">سجل المدفوعات</CardTitle>
                <CardDescription>جميع المدفوعات المسجلة لهذا اللاعب</CardDescription>
              </div>
              <Button asChild>
                <Link href={`/students/${id}/payment`}>تسجيل دفعة جديدة</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {studentPayments.length === 0 ? (
                <div className="text-center py-8 text-zinc-500">
                  لا يوجد مدفوعات مسجلة
                </div>
              ) : (
                <div className="space-y-3">
                  {studentPayments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-3 rounded-lg bg-zinc-50">
                      <div>
                        <p className="font-medium">{payment.amount} TL</p>
                        <p className="text-sm text-zinc-500">
                          {payment.paymentType === "monthly" && "اشتراك شهري"}
                          {payment.paymentType === "bus" && "رسوم الباص"}
                          {payment.paymentType === "uniform" && "الزي الرسمي"}
                          {payment.payerName && ` • ${payment.payerName}`}
                        </p>
                        {payment.notes && (
                          <p className="text-xs text-zinc-400 mt-1">{payment.notes}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-left">
                          <p className="text-sm">{payment.paymentDate}</p>
                          <p className="text-xs text-zinc-500">
                            {payment.paymentMethod === "cash" ? "نقدي" : "تحويل بنكي"}
                          </p>
                        </div>
                        <PaymentActions
                          paymentId={payment.id}
                          studentId={id}
                          studentName={student.name}
                          membershipNumber={student.membershipNumber || undefined}
                          amount={payment.amount}
                          paymentType={payment.paymentType as "monthly" | "bus" | "uniform"}
                          paymentMethod={payment.paymentMethod as "cash" | "bank_transfer"}
                          payerName={payment.payerName}
                          paymentDate={payment.paymentDate}
                          notes={payment.notes}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sibling Payments - Family View */}
          {siblingPaymentsData.length > 0 && (
            <Card className="bg-white border-violet-200">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  👨‍👦‍👦 مدفوعات الأخوة
                </CardTitle>
                <CardDescription>سجل مدفوعات أخوة هذا اللاعب - عرض موحد للعائلة</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {siblingPaymentsData.map((sibData) => (
                  <div key={sibData.siblingId} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-200 text-violet-700 text-xs font-bold">
                        {sibData.siblingName.charAt(0)}
                      </div>
                      <Link
                        href={`/students/${sibData.siblingId}`}
                        className="text-sm font-semibold text-violet-700 hover:underline"
                      >
                        {sibData.siblingName}
                      </Link>
                      <span className="text-xs text-zinc-400">
                        ({sibData.payments.length} دفعات)
                      </span>
                    </div>

                    {sibData.payments.length === 0 ? (
                      <p className="text-xs text-zinc-400 pr-9">لا يوجد مدفوعات</p>
                    ) : (
                      <div className="space-y-1.5 pr-9">
                        {sibData.payments.map((payment) => (
                          <div
                            key={payment.id}
                            className="flex items-center justify-between p-2.5 rounded-lg bg-violet-50 border border-violet-100"
                          >
                            <div>
                              <p className="text-sm font-medium">{payment.amount} TL</p>
                              <p className="text-xs text-zinc-500">
                                {payment.paymentType === "monthly" && "اشتراك شهري"}
                                {payment.paymentType === "bus" && "رسوم الباص"}
                                {payment.paymentType === "uniform" && "الزي الرسمي"}
                                {payment.payerName && ` • ${payment.payerName}`}
                              </p>
                              {payment.notes && (
                                <p className="text-xs text-violet-400 mt-0.5">{payment.notes}</p>
                              )}
                            </div>
                            <div className="text-left">
                              <p className="text-xs">{payment.paymentDate}</p>
                              <p className="text-xs text-zinc-400">
                                {payment.paymentMethod === "cash" ? "نقدي" : "تحويل بنكي"}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* Family Total Summary */}
                {(() => {
                  const ownTotal = studentPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
                  const sibTotal = siblingPaymentsData.reduce(
                    (sum, s) => sum + s.payments.reduce((ps, p) => ps + parseFloat(p.amount), 0),
                    0
                  );
                  return (
                    <div className="mt-4 p-3 rounded-xl bg-gradient-to-l from-violet-100 to-violet-50 border border-violet-200">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center text-sm">
                        <div>
                          <p className="text-xs text-zinc-500">{student.name}</p>
                          <p className="font-bold text-violet-700">{ownTotal.toFixed(0)} TL</p>
                        </div>
                        <div>
                          <p className="text-xs text-zinc-500">الأخوة</p>
                          <p className="font-bold text-violet-700">{sibTotal.toFixed(0)} TL</p>
                        </div>
                        <div>
                          <p className="text-xs text-zinc-500">إجمالي العائلة</p>
                          <p className="font-bold text-violet-900">{(ownTotal + sibTotal).toFixed(0)} TL</p>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance" className="space-y-4">
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-base">سجل الحضور</CardTitle>
              <CardDescription>حضور اللاعب في التدريبات</CardDescription>
            </CardHeader>
            <CardContent>
              <AttendanceHistory studentId={id} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Evaluations Tab */}
        <TabsContent value="evaluations" className="space-y-4">
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-base">التقييمات الشهرية</CardTitle>
              <CardDescription>تقييم أداء اللاعب من المدربين</CardDescription>
            </CardHeader>
            <CardContent>
              <EvaluationsTab studentId={id} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Escalation History Tab */}
        <TabsContent value="escalation" className="space-y-4">
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-base">سجل التصعيد والإشعارات</CardTitle>
              <CardDescription>تاريخ التذكيرات والتنبيهات للمدفوعات</CardDescription>
            </CardHeader>
            <CardContent>
              <EscalationHistory studentId={id} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
