"use client";

import type { ReportsData } from "@/lib/actions/reports";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Users,
  DollarSign,
  TrendingUp,
  CalendarCheck,
  UserPlus,
  AlertTriangle,
  BarChart3,
  Download,
  PieChart,
} from "lucide-react";
import { exportStudentsData, exportPaymentsData } from "@/lib/actions/exports";
import { useState } from "react";
import { SurveyManagement } from "./survey-management";
import { ClipboardList } from "lucide-react";

interface ReportsContentProps {
  data?: ReportsData;
  error?: string;
}

export function ReportsContent({ data, error }: ReportsContentProps) {
  const [exporting, setExporting] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<"reports" | "surveys">("reports");

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
        <h2 className="text-lg font-semibold mb-2">فشل في تحميل التقارير</h2>
        <p className="text-zinc-500">{error || "حدث خطأ غير متوقع"}</p>
      </div>
    );
  }

  async function handleExport(type: "students" | "payments") {
    setExporting(type);
    try {
      const result = type === "students"
        ? await exportStudentsData()
        : await exportPaymentsData();
      
      if (result.success && result.data) {
        const blob = new Blob([result.data], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = result.filename || `${type}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      // silently fail
    } finally {
      setExporting(null);
    }
  }

  const statusColors: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-800",
    trial: "bg-blue-100 text-blue-800",
    frozen: "bg-amber-100 text-amber-800",
    inactive: "bg-zinc-100 text-zinc-800",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">التقارير</h1>
          <p className="text-zinc-500">نظرة شاملة على أداء الأكاديمية</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport("students")}
            disabled={exporting === "students"}
          >
            <Download className="h-4 w-4 ms-2" />
            {exporting === "students" ? "جاري التصدير..." : "تصدير اللاعبين"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport("payments")}
            disabled={exporting === "payments"}
          >
            <Download className="h-4 w-4 ms-2" />
            {exporting === "payments" ? "جاري التصدير..." : "تصدير المدفوعات"}
          </Button>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2 border-b border-zinc-200 pb-1">
        <button
          onClick={() => setActiveView("reports")}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
            activeView === "reports"
              ? "bg-zinc-900 text-white"
              : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          الإحصائيات
        </button>
        <button
          onClick={() => setActiveView("surveys")}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
            activeView === "surveys"
              ? "bg-zinc-900 text-white"
              : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
          }`}
        >
          <ClipboardList className="h-4 w-4" />
          تقييم أولياء الأمور
        </button>
      </div>

      {activeView === "surveys" ? (
        <SurveyManagement />
      ) : (
      <>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{data.totalStudents}</p>
                <p className="text-xs text-zinc-500">إجمالي اللاعبين</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                <DollarSign className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{data.currentMonthRevenue.collected.toLocaleString()} <span className="text-sm font-normal text-zinc-500">ر.س</span></p>
                <p className="text-xs text-zinc-500">محصّل هذا الشهر</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                <TrendingUp className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{data.currentMonthRevenue.rate}%</p>
                <p className="text-xs text-zinc-500">نسبة التحصيل</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                <CalendarCheck className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{data.attendanceOverall.rate}%</p>
                <p className="text-xs text-zinc-500">نسبة الحضور</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart - Monthly Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="h-5 w-5" />
            الإيرادات الشهرية (آخر 6 أشهر)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.monthlyRevenue.length === 0 ? (
            <p className="text-center text-zinc-400 py-8">لا توجد بيانات</p>
          ) : (
            <div className="space-y-3">
              {data.monthlyRevenue.map((m) => {
                const maxExpected = Math.max(...data.monthlyRevenue.map(r => r.expected), 1);
                const collectedWidth = (m.collected / maxExpected) * 100;
                const expectedWidth = (m.expected / maxExpected) * 100;
                return (
                  <div key={m.yearMonth} className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                    <div className="w-full sm:w-28 text-sm text-zinc-600 shrink-0 text-left">{m.label}</div>
                    <div className="flex-1 relative">
                      <div className="h-6 bg-zinc-100 rounded-full overflow-hidden relative">
                        {m.expected > 0 && (
                          <div
                            className="absolute inset-y-0 right-0 bg-zinc-200 rounded-full"
                            style={{ width: `${expectedWidth}%` }}
                          />
                        )}
                        {m.collected > 0 && (
                          <div
                            className="absolute inset-y-0 right-0 bg-emerald-500 rounded-full"
                            style={{ width: `${collectedWidth}%` }}
                          />
                        )}
                      </div>
                    </div>
                    <div className="w-full sm:w-32 text-left text-sm shrink-0">
                      <span className="font-semibold text-emerald-600">{m.collected.toLocaleString()}</span>
                      <span className="text-zinc-400"> / {m.expected.toLocaleString()}</span>
                    </div>
                    <div className="w-12 text-left">
                      <Badge variant={m.rate >= 80 ? "default" : m.rate >= 50 ? "secondary" : "destructive"} className="text-xs">
                        {m.rate}%
                      </Badge>
                    </div>
                  </div>
                );
              })}
              <div className="flex items-center gap-4 pt-2 border-t text-sm text-zinc-500">
                <div className="w-28 shrink-0 text-left font-medium">الإجمالي</div>
                <div className="flex-1" />
                <div className="w-32 text-left shrink-0 font-semibold text-zinc-900">
                  {data.totalCollectedAllTime.toLocaleString()} ر.س
                </div>
                <div className="w-12" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Two columns: Students + Payments */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Student Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5" />
              توزيع اللاعبين
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* By Status */}
            <div>
              <p className="text-sm font-medium text-zinc-500 mb-2">حسب الحالة</p>
              <div className="flex flex-wrap gap-2">
                {data.studentsByStatus.map((s) => (
                  <div
                    key={s.status}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${statusColors[s.status] || "bg-zinc-100 text-zinc-800"}`}
                  >
                    <span>{s.label}</span>
                    <span className="font-bold">{s.count}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* By Age Group */}
            <div>
              <p className="text-sm font-medium text-zinc-500 mb-2">حسب الفئة العمرية</p>
              <div className="space-y-2">
                {data.studentsByAgeGroup.map((ag) => {
                  const pct = data.totalStudents > 0 ? Math.round((ag.count / data.totalStudents) * 100) : 0;
                  return (
                    <div key={ag.ageGroup} className="flex items-center gap-3">
                      <span className="text-sm w-20 shrink-0">{ag.ageGroup}</span>
                      <div className="flex-1 h-4 bg-zinc-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-16 text-left">{ag.count} ({pct}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <PieChart className="h-5 w-5" />
              تفصيل المدفوعات
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* By Type */}
            <div>
              <p className="text-sm font-medium text-zinc-500 mb-2">حسب النوع</p>
              {data.paymentsByType.length === 0 ? (
                <p className="text-sm text-zinc-400">لا توجد مدفوعات</p>
              ) : (
                <div className="space-y-2">
                  {data.paymentsByType.map((pt) => (
                    <div key={pt.type} className="flex items-center justify-between py-1.5 border-b border-zinc-50 last:border-0">
                      <div>
                        <span className="text-sm font-medium">{pt.label}</span>
                        <span className="text-xs text-zinc-400 mr-2">({pt.count} عملية)</span>
                      </div>
                      <span className="font-semibold text-sm">{pt.total.toLocaleString()} ر.س</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* By Method */}
            <div>
              <p className="text-sm font-medium text-zinc-500 mb-2">حسب طريقة الدفع</p>
              {data.paymentsByMethod.length === 0 ? (
                <p className="text-sm text-zinc-400">لا توجد مدفوعات</p>
              ) : (
                <div className="space-y-2">
                  {data.paymentsByMethod.map((pm) => (
                    <div key={pm.method} className="flex items-center justify-between py-1.5 border-b border-zinc-50 last:border-0">
                      <div>
                        <span className="text-sm font-medium">{pm.label}</span>
                        <span className="text-xs text-zinc-400 mr-2">({pm.count} عملية)</span>
                      </div>
                      <span className="font-semibold text-sm">{pm.total.toLocaleString()} ر.س</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Two columns: Attendance + Leads */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Attendance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarCheck className="h-5 w-5" />
              إحصائيات الحضور
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center p-3 bg-emerald-50 rounded-lg">
                <p className="text-2xl font-bold text-emerald-600">{data.attendanceOverall.present}</p>
                <p className="text-xs text-zinc-500">حاضر</p>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{data.attendanceOverall.absent}</p>
                <p className="text-xs text-zinc-500">غائب</p>
              </div>
              <div className="text-center p-3 bg-amber-50 rounded-lg">
                <p className="text-2xl font-bold text-amber-600">{data.attendanceOverall.excused}</p>
                <p className="text-xs text-zinc-500">مستأذن</p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{data.sessionCount}</p>
                <p className="text-xs text-zinc-500">جلسات تدريب</p>
              </div>
            </div>
            {data.attendanceOverall.total > 0 && (
              <div className="text-center pt-3 border-t">
                <p className="text-sm text-zinc-500">
                  نسبة الحضور الإجمالية:{" "}
                  <span className={`font-bold text-lg ${data.attendanceOverall.rate >= 80 ? "text-emerald-600" : data.attendanceOverall.rate >= 60 ? "text-amber-600" : "text-red-600"}`}>
                    {data.attendanceOverall.rate}%
                  </span>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Leads */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserPlus className="h-5 w-5" />
              العملاء المحتملين
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.leadsByStatus.length === 0 ? (
              <p className="text-center text-zinc-400 py-8">لا يوجد عملاء محتملين</p>
            ) : (
              <>
                <div className="space-y-2 mb-4">
                  {data.leadsByStatus.map((ls) => (
                    <div key={ls.status} className="flex items-center justify-between py-1.5 border-b border-zinc-50 last:border-0">
                      <span className="text-sm">{ls.label}</span>
                      <Badge variant="secondary">{ls.count}</Badge>
                    </div>
                  ))}
                </div>
                <div className="text-center pt-3 border-t">
                  <p className="text-sm text-zinc-500">
                    نسبة التحويل:{" "}
                    <span className="font-bold text-lg text-blue-600">{data.conversionRate}%</span>
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Overdue Students */}
      {data.overdueStudents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              لاعبين متأخرين في الدفع
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {data.overdueStudents.map((s) => (
                <Link
                  key={s.id}
                  href={`/students/${s.id}`}
                  className="flex items-center justify-between py-3 hover:bg-zinc-50 -mx-2 px-2 rounded transition-colors"
                >
                  <span className="font-medium">{s.name}</span>
                  <span className="text-red-600 font-semibold">{s.amount.toLocaleString()} ر.س</span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      </>
      )}
    </div>
  );
}
