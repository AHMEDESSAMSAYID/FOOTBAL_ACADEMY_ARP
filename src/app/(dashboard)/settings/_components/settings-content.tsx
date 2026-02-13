"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Download, 
  Activity, 
  Bell, 
  FileSpreadsheet,
  Clock,
  Users,
  CreditCard,
  UserPlus,
  Calendar,
  Settings,
  Shield
} from "lucide-react";
import { exportStudentsData, exportPaymentsData, exportLeadsData } from "@/lib/actions/exports";
import { toast } from "sonner";
import { useState, useTransition } from "react";

interface SettingsContentProps {
  stats: {
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  recentLogs: {
    id: string;
    actionType: string;
    entityType: string;
    entityId: string;
    details: unknown;
    createdAt: Date;
  }[];
}

const actionTypeLabels: Record<string, string> = {
  create: "إنشاء",
  update: "تحديث",
  delete: "حذف",
  view: "عرض",
  export: "تصدير",
};

const entityTypeLabels: Record<string, string> = {
  student: "لاعب",
  payment: "دفعة",
  lead: "عميل محتمل",
  attendance: "حضور",
  session: "جلسة تدريبية",
  evaluation: "تقييم",
  notification: "إشعار",
};

const entityIcons: Record<string, React.ReactNode> = {
  student: <Users className="h-4 w-4" />,
  payment: <CreditCard className="h-4 w-4" />,
  lead: <UserPlus className="h-4 w-4" />,
  attendance: <Calendar className="h-4 w-4" />,
};

function downloadCsv(data: string, filename: string) {
  const blob = new Blob([data], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function SettingsContent({ stats, recentLogs }: SettingsContentProps) {
  const [isPending, startTransition] = useTransition();

  function handleExport(type: "students" | "payments" | "leads") {
    startTransition(async () => {
      let result;
      switch (type) {
        case "students":
          result = await exportStudentsData();
          break;
        case "payments":
          result = await exportPaymentsData();
          break;
        case "leads":
          result = await exportLeadsData();
          break;
      }

      if (result.success && result.data) {
        downloadCsv(result.data, result.filename!);
        toast.success("تم تصدير البيانات بنجاح");
      } else {
        toast.error(result.error || "فشل في التصدير");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">الإعدادات والتقارير</h1>
        <p className="text-zinc-500">إدارة النظام، تصدير البيانات، وسجل النشاطات</p>
      </div>

      <Tabs defaultValue="exports" className="space-y-4">
        <TabsList className="w-full overflow-x-auto flex-nowrap justify-start">
          <TabsTrigger value="exports">
            <FileSpreadsheet className="h-4 w-4 ms-2" />
            تصدير البيانات
          </TabsTrigger>
          <TabsTrigger value="activity">
            <Activity className="h-4 w-4 ms-2" />
            سجل النشاطات
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 ms-2" />
            الإشعارات
          </TabsTrigger>
        </TabsList>

        {/* Exports Tab */}
        <TabsContent value="exports" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  تصدير اللاعبين
                </CardTitle>
                <CardDescription>
                  تصدير جميع بيانات اللاعبين مع جهات الاتصال والرسوم
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => handleExport("students")} 
                  disabled={isPending}
                  className="w-full"
                >
                  <Download className="h-4 w-4 ms-2" />
                  تحميل CSV
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-green-600" />
                  تصدير المدفوعات
                </CardTitle>
                <CardDescription>
                  تصدير جميع المدفوعات المسجلة مع تفاصيل التغطية
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => handleExport("payments")} 
                  disabled={isPending}
                  className="w-full"
                >
                  <Download className="h-4 w-4 ms-2" />
                  تحميل CSV
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-purple-600" />
                  تصدير العملاء المحتملين
                </CardTitle>
                <CardDescription>
                  تصدير بيانات CRM والعملاء المحتملين
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => handleExport("leads")} 
                  disabled={isPending}
                  className="w-full"
                >
                  <Download className="h-4 w-4 ms-2" />
                  تحميل CSV
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Activity Logs Tab */}
        <TabsContent value="activity" className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="bg-white">
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-blue-600">{stats.today}</p>
                <p className="text-sm text-zinc-500">نشاط اليوم</p>
              </CardContent>
            </Card>
            <Card className="bg-white">
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-green-600">{stats.thisWeek}</p>
                <p className="text-sm text-zinc-500">هذا الأسبوع</p>
              </CardContent>
            </Card>
            <Card className="bg-white">
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-purple-600">{stats.thisMonth}</p>
                <p className="text-sm text-zinc-500">هذا الشهر</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-base">آخر النشاطات</CardTitle>
              <CardDescription>سجل العمليات الأخيرة في النظام</CardDescription>
            </CardHeader>
            <CardContent>
              {recentLogs.length === 0 ? (
                <div className="text-center py-8 text-zinc-500">
                  لا يوجد نشاطات مسجلة بعد
                </div>
              ) : (
                <div className="space-y-3">
                  {recentLogs.map((log) => (
                    <div key={log.id} className="flex items-center gap-3 p-3 rounded-lg bg-zinc-50">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200">
                        {entityIcons[log.entityType] || <Activity className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">
                          {actionTypeLabels[log.actionType] || log.actionType}{" "}
                          {entityTypeLabels[log.entityType] || log.entityType}
                        </p>
                        <p className="text-xs text-zinc-500" suppressHydrationWarning>
                          {new Date(log.createdAt).toLocaleString("ar-EG")}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {actionTypeLabels[log.actionType] || log.actionType}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-5 w-5 text-amber-600" />
                نظام التصعيد التلقائي
              </CardTitle>
              <CardDescription>
                إعدادات التذكير والتنبيه للمدفوعات المتأخرة
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50">
                  <div>
                    <p className="font-medium text-blue-800">اليوم الأول</p>
                    <p className="text-sm text-blue-600">تذكير ودي بالدفعة المستحقة</p>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">تذكير</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50">
                  <div>
                    <p className="font-medium text-amber-800">اليوم الخامس</p>
                    <p className="text-sm text-amber-600">تحذير: قد يتأثر الحضور</p>
                  </div>
                  <Badge className="bg-amber-100 text-amber-800">تحذير</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-red-50">
                  <div>
                    <p className="font-medium text-red-800">اليوم العاشر</p>
                    <p className="text-sm text-red-600">حظر تلقائي وإبلاغ المدربين</p>
                  </div>
                  <Badge className="bg-red-100 text-red-800">حظر</Badge>
                </div>
              </div>
              <p className="text-xs text-zinc-500">
                يتم تشغيل فحص التصعيد يومياً تلقائياً. يمكن تكوينه عبر Railway Cron Jobs.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-base">قنوات الإشعارات</CardTitle>
              <CardDescription>
                يتم تكوين قنوات الإشعارات (البريد الإلكتروني / تيليجرام) من صفحة جهات اتصال كل لاعب
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-zinc-50 text-center">
                  <p className="text-2xl mb-1">📧</p>
                  <p className="font-medium">البريد الإلكتروني</p>
                  <p className="text-xs text-zinc-500">SMTP</p>
                </div>
                <div className="p-4 rounded-lg bg-zinc-50 text-center">
                  <p className="text-2xl mb-1">📱</p>
                  <p className="font-medium">تيليجرام</p>
                  <p className="text-xs text-zinc-500">Telegram Bot API</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
