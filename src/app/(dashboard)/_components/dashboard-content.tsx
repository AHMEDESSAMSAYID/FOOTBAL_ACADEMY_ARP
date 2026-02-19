"use client";

import { useLayout } from "@/lib/layout-context";
import { TodayScreen } from "./today-screen";
import type { DashboardStats } from "@/lib/actions/dashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { 
  Users, 
  CreditCard, 
  AlertCircle, 
  TrendingUp, 
  UserPlus, 
  DollarSign,
  Phone,
  CheckCircle2,
  Clock,
  BarChart3,
  Calendar
} from "lucide-react";

interface DashboardContentProps {
  stats: DashboardStats;
}

const MONTH_NAMES = [
  "يناير", "فبراير", "مارس", "أبريل",
  "مايو", "يونيو", "يوليو", "أغسطس",
  "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

function getMonthLabel(ym: string | null): string {
  if (!ym) return "الشهر الحالي";
  const [y, m] = ym.split("-").map(Number);
  return `${MONTH_NAMES[m - 1]} ${y}`;
}

function WebDashboard({ stats }: DashboardContentProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">مرحباً بك</h1>
          <p className="text-zinc-500" suppressHydrationWarning>
            {new Date().toLocaleDateString('ar-EG', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        <div className="flex gap-3">
          <Button asChild>
            <Link href="/students/new">
              <UserPlus className="h-4 w-4 ms-2" />
              لاعب جديد
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">
              اللاعبين النشطين
            </CardTitle>
            <Users className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.activeStudents}</div>
            <p className="text-xs text-zinc-500">من أصل {stats.totalStudents} لاعب</p>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">
              نسبة التحصيل
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.collectionRate}%</div>
            <div className="mt-2 h-2 bg-zinc-100 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${
                  stats.collectionRate >= 80 ? "bg-green-500" :
                  stats.collectionRate >= 50 ? "bg-amber-500" : "bg-red-500"
                }`}
                style={{ width: `${Math.min(stats.collectionRate, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">
              المدفوعات المتأخرة
            </CardTitle>
            <AlertCircle className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{stats.overdueCount}</div>
            <p className="text-xs text-zinc-500">+ {stats.partialCount} جزئي</p>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">
              العملاء المحتملين
            </CardTitle>
            <UserPlus className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{stats.newLeads}</div>
            <p className="text-xs text-zinc-500">من أصل {stats.totalLeads} عميل</p>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Revenue Card */}
        <Card className="col-span-2 bg-white">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              ملخص الإيرادات - {getMonthLabel(stats.selectedMonth)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8">
              <div>
                <p className="text-sm text-zinc-500 mb-1">المتوقع</p>
                <p className="text-2xl font-bold">{stats.expectedRevenue.toLocaleString()} TL</p>
              </div>
              <div>
                <p className="text-sm text-zinc-500 mb-1">المحصّل</p>
                <p className="text-2xl font-bold text-green-600">{stats.collectedRevenue.toLocaleString()} TL</p>
              </div>
              <div>
                <p className="text-sm text-zinc-500 mb-1">المتبقي</p>
                <p className="text-2xl font-bold text-amber-600">
                  {(stats.expectedRevenue - stats.collectedRevenue).toLocaleString()} TL
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold text-green-700">{stats.paidCount}</p>
                  <p className="text-sm text-green-600">مدفوع بالكامل</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-50">
                <Clock className="h-8 w-8 text-amber-600" />
                <div>
                  <p className="text-2xl font-bold text-amber-700">{stats.partialCount}</p>
                  <p className="text-sm text-amber-600">مدفوع جزئياً</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50">
                <AlertCircle className="h-8 w-8 text-red-600" />
                <div>
                  <p className="text-2xl font-bold text-red-700">{stats.overdueCount}</p>
                  <p className="text-sm text-red-600">متأخر</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Students Summary */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              ملخص اللاعبين
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-zinc-500">إجمالي</span>
              <span className="text-xl font-bold">{stats.totalStudents}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500" />
                <span className="text-zinc-600">نشط</span>
              </div>
              <span className="font-medium text-green-600">{stats.activeStudents}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-amber-500" />
                <span className="text-zinc-600">تجريبي</span>
              </div>
              <span className="font-medium text-amber-600">{stats.trialStudents}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500" />
                <span className="text-zinc-600">مجمد</span>
              </div>
              <span className="font-medium text-red-600">{stats.frozenStudents}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Needs Attention */}
      {stats.needsAttention.length > 0 && (
        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              يحتاج متابعة
            </CardTitle>
            <Button variant="outline" asChild>
              <Link href="/payments">عرض الكل</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {stats.needsAttention.slice(0, 8).map((item) => (
                <div 
                  key={item.studentId}
                  className="flex items-center justify-between py-3"
                >
                  <div className="flex items-center gap-3">
                    <Badge className={
                      item.type === "blocked" ? "bg-red-100 text-red-700" :
                      item.type === "overdue" ? "bg-amber-100 text-amber-700" :
                      "bg-yellow-100 text-yellow-700"
                    }>
                      {item.type === "blocked" ? "محظور" :
                       item.type === "overdue" ? "متأخر" : "جزئي"}
                    </Badge>
                    <div>
                      <Link href={`/students/${item.studentId}`} className="font-medium hover:underline">
                        {item.studentName}
                      </Link>
                      {item.daysOverdue ? (
                        <p className="text-sm text-zinc-500">متأخر {item.daysOverdue} يوم</p>
                      ) : item.amount ? (
                        <p className="text-sm text-zinc-500">{item.amount} TL</p>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.phone && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={`tel:${item.phone}`}>
                          <Phone className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    <Button size="sm" asChild>
                      <Link href={`/students/${item.studentId}/payment`}>دفع</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function DashboardContent({ stats }: DashboardContentProps) {
  const { layout, isHydrated } = useLayout();
  
  // Show loading skeleton until hydrated
  if (!isHydrated) {
    return (
      <div className="p-4 space-y-6 animate-pulse">
        <div className="h-8 w-32 bg-zinc-200 rounded mx-auto" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-20 bg-zinc-200 rounded-lg" />
          ))}
        </div>
        <div className="h-32 bg-zinc-200 rounded-lg" />
      </div>
    );
  }
  
  if (layout === "web") {
    return <WebDashboard stats={stats} />;
  }
  
  return <TodayScreen stats={stats} />;
}
