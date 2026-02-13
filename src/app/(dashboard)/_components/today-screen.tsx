"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { DashboardStats } from "@/lib/actions/dashboard";
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
  Clock
} from "lucide-react";

interface TodayScreenProps {
  stats: DashboardStats;
}

// Format number to Arabic numerals
function toArabicNumerals(num: number): string {
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return num.toString().split('').map(d => {
    const digit = parseInt(d);
    return isNaN(digit) ? d : arabicDigits[digit];
  }).join('');
}

export function TodayScreen({ stats }: TodayScreenProps) {
  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="text-center">
        <p className="text-sm text-zinc-500">اليوم</p>
        <p className="text-lg font-semibold" suppressHydrationWarning>
          {new Date().toLocaleDateString('ar-EG', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/students?status=active">
          <Card className="bg-white hover:bg-zinc-50 transition-colors cursor-pointer">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between">
                <Users className="h-5 w-5 text-green-600" />
                <CardDescription className="text-xs">اللاعبين النشطين</CardDescription>
              </div>
              <CardTitle className="text-2xl text-green-600">
                {toArabicNumerals(stats.activeStudents)}
              </CardTitle>
            </CardHeader>
          </Card>
        </Link>
        
        <Link href="/payments?tab=overdue">
          <Card className="bg-white hover:bg-zinc-50 transition-colors cursor-pointer">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <CardDescription className="text-xs">متأخر</CardDescription>
              </div>
              <CardTitle className="text-2xl text-red-600">
                {toArabicNumerals(stats.overdueCount)}
              </CardTitle>
            </CardHeader>
          </Card>
        </Link>
        
        <Link href="/payments">
          <Card className="bg-white hover:bg-zinc-50 transition-colors cursor-pointer">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <CardDescription className="text-xs">نسبة التحصيل</CardDescription>
              </div>
              <CardTitle className="text-2xl text-blue-600">
                {toArabicNumerals(stats.collectionRate)}٪
              </CardTitle>
            </CardHeader>
          </Card>
        </Link>
        
        <Link href="/crm">
          <Card className="bg-white hover:bg-zinc-50 transition-colors cursor-pointer">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between">
                <UserPlus className="h-5 w-5 text-purple-600" />
                <CardDescription className="text-xs">عملاء جدد</CardDescription>
              </div>
              <CardTitle className="text-2xl text-purple-600">
                {toArabicNumerals(stats.newLeads)}
              </CardTitle>
            </CardHeader>
          </Card>
        </Link>
      </div>

      {/* Collection Summary */}
      <Card className="bg-gradient-to-l from-blue-50 to-white border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-500">المتوقع هذا الشهر</p>
              <p className="text-lg font-bold">{stats.expectedRevenue.toLocaleString()} ج.م</p>
            </div>
            <div className="h-10 w-px bg-zinc-200" />
            <div className="text-left">
              <p className="text-xs text-zinc-500">المحصّل</p>
              <p className="text-lg font-bold text-green-600">{stats.collectedRevenue.toLocaleString()} ج.م</p>
            </div>
          </div>
          <div className="mt-3">
            <div className="flex justify-between text-xs mb-1">
              <span>التقدم</span>
              <span>{stats.collectionRate}%</span>
            </div>
            <div className="h-2 bg-zinc-200 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all ${
                  stats.collectionRate >= 80 ? "bg-green-500" :
                  stats.collectionRate >= 50 ? "bg-amber-500" : "bg-red-500"
                }`}
                style={{ width: `${Math.min(stats.collectionRate, 100)}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Status Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-3 text-center">
            <CheckCircle2 className="h-5 w-5 text-green-600 mx-auto mb-1" />
            <p className="text-xl font-bold text-green-700">{toArabicNumerals(stats.paidCount)}</p>
            <p className="text-xs text-green-600">مدفوع</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-3 text-center">
            <Clock className="h-5 w-5 text-amber-600 mx-auto mb-1" />
            <p className="text-xl font-bold text-amber-700">{toArabicNumerals(stats.partialCount)}</p>
            <p className="text-xs text-amber-600">جزئي</p>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-3 text-center">
            <AlertCircle className="h-5 w-5 text-red-600 mx-auto mb-1" />
            <p className="text-xl font-bold text-red-700">{toArabicNumerals(stats.overdueCount)}</p>
            <p className="text-xs text-red-600">متأخر</p>
          </CardContent>
        </Card>
      </div>

      {/* Needs Attention */}
      {stats.needsAttention.length > 0 && (
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">يحتاج متابعة</CardTitle>
              <Link href="/payments?tab=attention">
                <Button variant="ghost" size="sm" className="text-xs">
                  عرض الكل
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats.needsAttention.slice(0, 5).map((item) => (
              <div 
                key={item.studentId}
                className={`flex items-center justify-between rounded-lg p-3 ${
                  item.type === "blocked" ? "bg-red-50" :
                  item.type === "overdue" ? "bg-amber-50" : "bg-yellow-50"
                }`}
              >
                <div>
                  <Link href={`/students/${item.studentId}`} className="font-medium hover:underline">
                    {item.studentName}
                  </Link>
                  <p className="text-sm text-zinc-500">
                    {item.type === "blocked" && "محظور"}
                    {item.type === "overdue" && `متأخر ${item.amount} ج.م`}
                    {item.type === "partial" && `متبقي ${item.amount} ج.م`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {item.phone && (
                    <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                      <a href={`tel:${item.phone}`}>
                        <Phone className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  <Badge className={
                    item.type === "blocked" ? "bg-red-100 text-red-700" :
                    item.type === "overdue" ? "bg-amber-100 text-amber-700" :
                    "bg-yellow-100 text-yellow-700"
                  }>
                    {item.type === "blocked" ? "محظور" :
                     item.type === "overdue" ? "متأخر" : "جزئي"}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="space-y-3">
        <h2 className="font-semibold">إجراءات سريعة</h2>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" className="h-auto flex-col gap-1 py-4 bg-white" asChild>
            <Link href="/students/new">
              <UserPlus className="h-6 w-6 text-blue-600" />
              <span>تسجيل لاعب</span>
            </Link>
          </Button>
          <Button variant="outline" className="h-auto flex-col gap-1 py-4 bg-white" asChild>
            <Link href="/payments/new">
              <DollarSign className="h-6 w-6 text-green-600" />
              <span>تسجيل دفعة</span>
            </Link>
          </Button>
          <Button variant="outline" className="h-auto flex-col gap-1 py-4 bg-white" asChild>
            <Link href="/crm/new">
              <Phone className="h-6 w-6 text-purple-600" />
              <span>عميل جديد</span>
            </Link>
          </Button>
          <Button variant="outline" className="h-auto flex-col gap-1 py-4 bg-white" asChild>
            <Link href="/attendance">
              <CheckCircle2 className="h-6 w-6 text-teal-600" />
              <span>الحضور</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Student Stats Summary */}
      <Card className="bg-zinc-50 border-zinc-200">
        <CardContent className="p-4">
          <h3 className="font-medium text-sm mb-3">ملخص اللاعبين</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-500">إجمالي اللاعبين</span>
              <span className="font-medium">{stats.totalStudents}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">نشط</span>
              <span className="font-medium text-green-600">{stats.activeStudents}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">تجريبي</span>
              <span className="font-medium text-amber-600">{stats.trialStudents}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">مجمد</span>
              <span className="font-medium text-red-600">{stats.frozenStudents}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
