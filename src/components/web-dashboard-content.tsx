"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function WebDashboardContent() {
  return (
    <div className="space-y-8">
      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">
              اللاعبين النشطين
            </CardTitle>
            <span className="rounded-full bg-green-100 p-2 text-green-600">👥</span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">١٢٥</div>
            <p className="text-xs text-green-600 mt-1">
              +٥ من الشهر الماضي
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">
              إيرادات الشهر
            </CardTitle>
            <span className="rounded-full bg-blue-100 p-2 text-blue-600">💰</span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">٤٥,٠٠٠</div>
            <p className="text-xs text-zinc-500 mt-1">جنيه مصري</p>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">
              كفاءة التحصيل
            </CardTitle>
            <span className="rounded-full bg-purple-100 p-2 text-purple-600">📊</span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">٧٥٪</div>
            <div className="mt-2 h-2 w-full rounded-full bg-zinc-100">
              <div className="h-2 w-3/4 rounded-full bg-purple-500"></div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">
              العملاء المحتملين
            </CardTitle>
            <span className="rounded-full bg-amber-100 p-2 text-amber-600">📋</span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">٢٣</div>
            <p className="text-xs text-amber-600 mt-1">
              ٨ بحاجة متابعة
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Needs Attention - Main */}
        <Card className="col-span-2 bg-white">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>تحتاج انتباه</CardTitle>
              <CardDescription>مدفوعات متأخرة تحتاج متابعة</CardDescription>
            </div>
            <Button variant="outline" size="sm">عرض الكل</Button>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-zinc-200">
              <table className="w-full">
                <thead className="bg-zinc-50">
                  <tr className="text-right text-sm text-zinc-600">
                    <th className="p-4 font-medium">اللاعب</th>
                    <th className="p-4 font-medium">الفئة العمرية</th>
                    <th className="p-4 font-medium">المبلغ المستحق</th>
                    <th className="p-4 font-medium">أيام التأخير</th>
                    <th className="p-4 font-medium">الحالة</th>
                    <th className="p-4 font-medium">إجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  <tr className="hover:bg-zinc-50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-sm font-medium">
                          م.أ
                        </div>
                        <div>
                          <p className="font-medium">محمد أحمد</p>
                          <p className="text-sm text-zinc-500">mohamed@email.com</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm">تحت ١٢ سنة</td>
                    <td className="p-4 font-medium">٥٠٠ ج.م</td>
                    <td className="p-4">
                      <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
                        ٣٠ يوم
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
                        متابعة
                      </span>
                    </td>
                    <td className="p-4">
                      <Button variant="ghost" size="sm">📞 اتصال</Button>
                    </td>
                  </tr>
                  <tr className="hover:bg-zinc-50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-sm font-medium">
                          ع.ح
                        </div>
                        <div>
                          <p className="font-medium">علي حسن</p>
                          <p className="text-sm text-zinc-500">ali@email.com</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm">تحت ١٤ سنة</td>
                    <td className="p-4 font-medium">١,٠٠٠ ج.م</td>
                    <td className="p-4">
                      <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
                        ٦٠ يوم
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
                        عاجل
                      </span>
                    </td>
                    <td className="p-4">
                      <Button variant="ghost" size="sm">📞 اتصال</Button>
                    </td>
                  </tr>
                  <tr className="hover:bg-zinc-50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-sm font-medium">
                          ع.خ
                        </div>
                        <div>
                          <p className="font-medium">عمر خالد</p>
                          <p className="text-sm text-zinc-500">omar@email.com</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm">تحت ١٠ سنة</td>
                    <td className="p-4 font-medium">٥٠٠ ج.م</td>
                    <td className="p-4">
                      <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
                        ١٥ يوم
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
                        متابعة
                      </span>
                    </td>
                    <td className="p-4">
                      <Button variant="ghost" size="sm">📞 اتصال</Button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-base">إجراءات سريعة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start gap-3" variant="outline">
                <span className="text-lg">➕</span>
                تسجيل لاعب جديد
              </Button>
              <Button className="w-full justify-start gap-3" variant="outline">
                <span className="text-lg">💵</span>
                تسجيل دفعة
              </Button>
              <Button className="w-full justify-start gap-3" variant="outline">
                <span className="text-lg">📞</span>
                إضافة عميل محتمل
              </Button>
              <Button className="w-full justify-start gap-3" variant="outline">
                <span className="text-lg">✅</span>
                تسجيل الحضور
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-base">النشاط الأخير</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 text-green-500">✓</span>
                <div>
                  <p className="text-sm font-medium">دفعة جديدة</p>
                  <p className="text-xs text-zinc-500">أحمد محمود - ٥٠٠ ج.م</p>
                  <p className="text-xs text-zinc-400">منذ ١٠ دقائق</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-0.5 text-blue-500">👤</span>
                <div>
                  <p className="text-sm font-medium">لاعب جديد</p>
                  <p className="text-xs text-zinc-500">يوسف حسين - تحت ١٢</p>
                  <p className="text-xs text-zinc-400">منذ ساعة</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-0.5 text-amber-500">📋</span>
                <div>
                  <p className="text-sm font-medium">عميل محتمل</p>
                  <p className="text-xs text-zinc-500">استفسار عن تسجيل</p>
                  <p className="text-xs text-zinc-400">منذ ٣ ساعات</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-2 gap-6">
        {/* Revenue Chart Placeholder */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle>الإيرادات الشهرية</CardTitle>
            <CardDescription>آخر ٦ أشهر</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-48 items-end justify-around gap-2">
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 rounded-t bg-blue-200" style={{ height: '60%' }}></div>
                <span className="text-xs text-zinc-500">سبتمبر</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 rounded-t bg-blue-300" style={{ height: '75%' }}></div>
                <span className="text-xs text-zinc-500">أكتوبر</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 rounded-t bg-blue-400" style={{ height: '65%' }}></div>
                <span className="text-xs text-zinc-500">نوفمبر</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 rounded-t bg-blue-500" style={{ height: '80%' }}></div>
                <span className="text-xs text-zinc-500">ديسمبر</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 rounded-t bg-blue-600" style={{ height: '90%' }}></div>
                <span className="text-xs text-zinc-500">يناير</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 rounded-t bg-blue-700" style={{ height: '85%' }}></div>
                <span className="text-xs text-zinc-500">فبراير</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Age Group Distribution */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle>توزيع الفئات العمرية</CardTitle>
            <CardDescription>عدد اللاعبين في كل فئة</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">تحت ٨ سنوات</span>
                <div className="flex items-center gap-3">
                  <div className="h-3 w-32 rounded-full bg-zinc-100">
                    <div className="h-3 w-1/4 rounded-full bg-green-500"></div>
                  </div>
                  <span className="text-sm font-medium w-8">٢٥</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">تحت ١٠ سنوات</span>
                <div className="flex items-center gap-3">
                  <div className="h-3 w-32 rounded-full bg-zinc-100">
                    <div className="h-3 w-2/5 rounded-full bg-blue-500"></div>
                  </div>
                  <span className="text-sm font-medium w-8">٣٥</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">تحت ١٢ سنة</span>
                <div className="flex items-center gap-3">
                  <div className="h-3 w-32 rounded-full bg-zinc-100">
                    <div className="h-3 w-3/5 rounded-full bg-purple-500"></div>
                  </div>
                  <span className="text-sm font-medium w-8">٤٠</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">تحت ١٤ سنة</span>
                <div className="flex items-center gap-3">
                  <div className="h-3 w-32 rounded-full bg-zinc-100">
                    <div className="h-3 w-1/3 rounded-full bg-amber-500"></div>
                  </div>
                  <span className="text-sm font-medium w-8">٢٥</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
