"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  getStudentsReportOverview,
  getStudentDetailReport,
  type StudentReportSummary,
  type MonthlyRecord,
} from "@/lib/actions/student-reports";
import { sendReportSms } from "@/lib/actions/notifications";
import { toast } from "sonner";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Minus,
  Search,
  Users,
  BarChart3,
  Star,
  Heart,
  ChevronDown,
  ChevronUp,
  CalendarCheck,
  FileDown,
  MessageSquare,
} from "lucide-react";

// ===== PDF Export =====
function handlePrintReport() {
  window.print();
}

// ===== Score color helpers =====
function scoreColor(score: number, max: number): string {
  const pct = (score / max) * 100;
  if (pct >= 80) return "text-green-600";
  if (pct >= 60) return "text-yellow-600";
  if (pct >= 40) return "text-orange-500";
  return "text-red-500";
}

function scoreBg(score: number, max: number): string {
  const pct = (score / max) * 100;
  if (pct >= 80) return "bg-green-500";
  if (pct >= 60) return "bg-yellow-500";
  if (pct >= 40) return "bg-orange-500";
  return "bg-red-500";
}

function scoreBadgeBg(score: number, max: number): string {
  const pct = (score / max) * 100;
  if (pct >= 80) return "bg-green-100 text-green-800";
  if (pct >= 60) return "bg-yellow-100 text-yellow-800";
  if (pct >= 40) return "bg-orange-100 text-orange-800";
  return "bg-red-100 text-red-800";
}

// ===== OVERVIEW VIEW =====
function OverviewView({
  students: studentsList,
  totals,
  onSelect,
}: {
  students: StudentReportSummary[];
  totals: {
    totalStudents: number;
    evaluatedStudents: number;
    globalAvgCoach: number;
    globalAvgParent: number;
    globalAvgCombined: number;
    globalAttendanceRate: number;
  };
  onSelect: (id: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "coach" | "parent" | "combined" | "attendance">("combined");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const filtered = studentsList
    .filter((s) => s.name.includes(search))
    .sort((a, b) => {
      let diff = 0;
      switch (sortBy) {
        case "name": diff = a.name.localeCompare(b.name, "ar"); break;
        case "coach": diff = a.avgCoach - b.avgCoach; break;
        case "parent": diff = a.avgParent - b.avgParent; break;
        case "combined": diff = a.avgCombined - b.avgCombined; break;
        case "attendance": diff = a.attendanceRate - b.attendanceRate; break;
      }
      return sortDir === "desc" ? -diff : diff;
    });

  const toggleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else { setSortBy(col); setSortDir("desc"); }
  };

  const SortIcon = ({ col }: { col: typeof sortBy }) => {
    if (sortBy !== col) return null;
    return sortDir === "desc" ? <ChevronDown className="inline h-3.5 w-3.5" /> : <ChevronUp className="inline h-3.5 w-3.5" />;
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-zinc-500">اللاعبين النشطين</p>
                <p className="text-xl font-bold">{totals.totalStudents}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                <Star className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-zinc-500">معدل تقييم لاعب الشهر</p>
                {(() => {
                  const scaled = Math.round((totals.globalAvgCoach / 50) * 46 * 10) / 10;
                  return (
                    <p className={`text-xl font-bold ${scoreColor(scaled, 46)}`}>
                      {scaled}<span className="text-sm text-zinc-400">/46</span>
                    </p>
                  );
                })()}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pink-100">
                <Heart className="h-5 w-5 text-pink-600" />
              </div>
              <div>
                <p className="text-xs text-zinc-500">معدل تقييم الوالدين</p>
                {(() => {
                  const scaled = Math.round((totals.globalAvgParent / 50) * 46 * 10) / 10;
                  return (
                    <p className={`text-xl font-bold ${scoreColor(scaled, 46)}`}>
                      {scaled}<span className="text-sm text-zinc-400">/46</span>
                    </p>
                  );
                })()}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                <CalendarCheck className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-zinc-500">معدل الحضور</p>
                <p className={`text-xl font-bold ${scoreColor(totals.globalAttendanceRate, 100)}`}>
                  {totals.globalAttendanceRate}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <BarChart3 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-zinc-500">المعدل الإجمالي</p>
                <p className={`text-xl font-bold ${scoreColor(totals.globalAvgCombined, 100)}`}>
                  {totals.globalAvgCombined}<span className="text-sm text-zinc-400">/100</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative print:hidden">
        <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <Input
          placeholder="بحث عن لاعب..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pr-10"
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-zinc-50 text-zinc-600">
                  <th className="px-4 py-3 text-right font-medium">
                    <button onClick={() => toggleSort("name")} className="flex items-center gap-1">
                      اللاعب <SortIcon col="name" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-center font-medium">
                    <button onClick={() => toggleSort("attendance")} className="flex items-center justify-center gap-1">
                      الحضور <SortIcon col="attendance" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-center font-medium">
                    <button onClick={() => toggleSort("coach")} className="flex items-center justify-center gap-1">
                      المدرب /46 <SortIcon col="coach" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-center font-medium">
                    <button onClick={() => toggleSort("parent")} className="flex items-center justify-center gap-1">
                      الوالدين /46 <SortIcon col="parent" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-center font-medium">
                    <button onClick={() => toggleSort("combined")} className="flex items-center justify-center gap-1">
                      الإجمالي /100 <SortIcon col="combined" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-center font-medium">الاتجاه</th>
                  <th className="w-20 px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-zinc-400">
                      لا توجد بيانات
                    </td>
                  </tr>
                ) : (
                  filtered.map((s) => (
                    <tr key={s.id} className="cursor-pointer transition-colors hover:bg-zinc-50" onClick={() => onSelect(s.id)}>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-zinc-900">{s.name}</p>
                          {s.ageGroup && (
                            <p className="text-xs text-zinc-400">{s.ageGroup}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {s.attendanceTotal > 0 ? (
                          <span className={`font-semibold ${scoreColor(s.attendanceRate, 100)}`}>
                            {s.attendanceRate}%
                          </span>
                        ) : (
                          <span className="text-zinc-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {s.avgCoach > 0 ? (
                          <span className={`font-semibold ${scoreColor(Math.round((s.avgCoach / 50) * 46 * 10) / 10, 46)}`}>
                            {Math.round((s.avgCoach / 50) * 46 * 10) / 10}
                          </span>
                        ) : (
                          <span className="text-zinc-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {s.avgParent > 0 ? (
                          <span className={`font-semibold ${scoreColor(Math.round((s.avgParent / 50) * 46 * 10) / 10, 46)}`}>
                            {Math.round((s.avgParent / 50) * 46 * 10) / 10}
                          </span>
                        ) : (
                          <span className="text-zinc-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {s.avgCombined > 0 ? (
                          <Badge className={scoreBadgeBg(s.avgCombined, 100)}>
                            {s.avgCombined}
                          </Badge>
                        ) : (
                          <span className="text-zinc-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {s.trend === "up" && <TrendingUp className="mx-auto h-4 w-4 text-green-500" />}
                        {s.trend === "down" && <TrendingDown className="mx-auto h-4 w-4 text-red-500" />}
                        {s.trend === "stable" && <Minus className="mx-auto h-4 w-4 text-zinc-400" />}
                        {s.trend === "none" && <span className="text-zinc-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Button variant="ghost" size="sm" className="text-xs print:hidden">
                          تفاصيل
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ===== DETAIL VIEW =====
function DetailView({
  student,
  records,
  averages,
  attendanceSummary,
  onBack,
}: {
  student: { id: string; name: string; ageGroup: string | null };
  records: MonthlyRecord[];
  averages: { coach: number; parent: number; combined: number };
  attendanceSummary: { present: number; absent: number; excused: number; total: number; rate: number };
  onBack: () => void;
}) {
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);
  const [sendingSms, setSendingSms] = useState(false);
  const trendData = [...records].reverse();

  const handleSendReportSms = async () => {
    setSendingSms(true);
    try {
      const result = await sendReportSms(student.id, student.name);
      if (result.success) {
        toast.success("تم إرسال إشعار لولي الأمر");
      } else {
        toast.error(result.error || "فشل في إرسال الإشعار");
      }
    } catch {
      toast.error("فشل في إرسال الإشعار");
    } finally {
      setSendingSms(false);
    }
  };

  return (
    <div className="space-y-6" id="student-report-detail">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack} className="print:hidden">
            <ArrowLeft className="ml-1 h-4 w-4" />
            رجوع
          </Button>
          <div>
            <h2 className="text-xl font-bold text-zinc-900">{student.name}</h2>
            {student.ageGroup && (
              <p className="text-sm text-zinc-500">الفئة العمرية: {student.ageGroup}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSendReportSms}
            disabled={sendingSms}
            className="gap-2 print:hidden text-blue-600 border-blue-200 hover:bg-blue-50"
          >
            <MessageSquare className="h-4 w-4" />
            {sendingSms ? "جاري الإرسال..." : "إرسال SMS"}
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrintReport} className="gap-2 print:hidden">
            <FileDown className="h-4 w-4" />
            تصدير PDF
          </Button>
        </div>
      </div>

      {/* Print-only header */}
      <div className="hidden print:block print:mb-4">
        <div className="flex items-center justify-between border-b-2 border-zinc-800 pb-3">
          <div>
            <h1 className="text-2xl font-bold">⚽  Española</h1>
            <p className="text-sm text-zinc-600">تقرير أداء اللاعب</p>
          </div>
          <div className="text-left text-sm text-zinc-600">
            <p>التاريخ: {new Date().toLocaleDateString("ar-EG")}</p>
          </div>
        </div>
      </div>

      {/* Averages */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-zinc-500">معدل المدرب</p>
            {(() => {
              const scaled = Math.round((averages.coach / 50) * 46 * 10) / 10;
              return (
                <>
                  <p className={`text-2xl font-bold ${scoreColor(scaled, 46)}`}>
                    {scaled}<span className="text-sm text-zinc-400">/46</span>
                  </p>
                  <div className="mx-auto mt-2 h-2 w-full max-w-32 overflow-hidden rounded-full bg-zinc-100">
                    <div
                      className={`h-full rounded-full ${scoreBg(scaled, 46)}`}
                      style={{ width: `${(scaled / 46) * 100}%` }}
                    />
                  </div>
                </>
              );
            })()}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-zinc-500">معدل الوالدين</p>
            {(() => {
              const scaled = Math.round((averages.parent / 50) * 46 * 10) / 10;
              return (
                <>
                  <p className={`text-2xl font-bold ${scoreColor(scaled, 46)}`}>
                    {scaled}<span className="text-sm text-zinc-400">/46</span>
                  </p>
                  <div className="mx-auto mt-2 h-2 w-full max-w-32 overflow-hidden rounded-full bg-zinc-100">
                    <div
                      className={`h-full rounded-full ${scoreBg(scaled, 46)}`}
                      style={{ width: `${(scaled / 46) * 100}%` }}
                    />
                  </div>
                </>
              );
            })()}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-zinc-500">الحضور</p>
            {(() => {
              const attPoints = Math.min(attendanceSummary.present, 8);
              return (
                <>
                  <p className={`text-2xl font-bold ${scoreColor(attPoints, 8)}`}>
                    {attPoints}<span className="text-sm text-zinc-400">/8</span>
                  </p>
                  <p className="mt-1 text-[10px] text-zinc-400">
                    {attendanceSummary.present} حضور من {attendanceSummary.total} حصة
                  </p>
                  <div className="mx-auto mt-1 h-2 w-full max-w-32 overflow-hidden rounded-full bg-zinc-100">
                    <div
                      className={`h-full rounded-full ${scoreBg(attPoints, 8)}`}
                      style={{ width: `${(attPoints / 8) * 100}%` }}
                    />
                  </div>
                </>
              );
            })()}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-zinc-500">المعدل الإجمالي</p>
            <p className={`text-2xl font-bold ${scoreColor(averages.combined, 100)}`}>
              {averages.combined}<span className="text-sm text-zinc-400">/100</span>
            </p>
            <div className="mx-auto mt-2 h-2 w-full max-w-32 overflow-hidden rounded-full bg-zinc-100">
              <div
                className={`h-full rounded-full ${scoreBg(averages.combined, 100)}`}
                style={{ width: `${(averages.combined / 100) * 100}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Breakdown */}
      {attendanceSummary.total > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarCheck className="h-4 w-4" /> ملخص الحضور
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div className="rounded-lg bg-green-50 p-3">
                <p className="text-2xl font-bold text-green-600">{attendanceSummary.present}</p>
                <p className="text-xs text-green-700">حاضر</p>
              </div>
              <div className="rounded-lg bg-red-50 p-3">
                <p className="text-2xl font-bold text-red-500">{attendanceSummary.absent}</p>
                <p className="text-xs text-red-700">غائب</p>
              </div>
              <div className="rounded-lg bg-amber-50 p-3">
                <p className="text-2xl font-bold text-amber-500">{attendanceSummary.excused}</p>
                <p className="text-xs text-amber-700">مستأذن</p>
              </div>
            </div>
            <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-zinc-100">
              {attendanceSummary.present > 0 && (
                <div className="bg-green-500" style={{ width: `${(attendanceSummary.present / attendanceSummary.total) * 100}%` }} />
              )}
              {attendanceSummary.excused > 0 && (
                <div className="bg-amber-400" style={{ width: `${(attendanceSummary.excused / attendanceSummary.total) * 100}%` }} />
              )}
              {attendanceSummary.absent > 0 && (
                <div className="bg-red-400" style={{ width: `${(attendanceSummary.absent / attendanceSummary.total) * 100}%` }} />
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Monthly Trend Chart */}
      {trendData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">التطور الشهري</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2" style={{ minHeight: 220 }}>
              {trendData.map((rec) => {
                // Scale to contribution out of 100: coach(46) + parent(46) + attendance(8)
                const scaledCoach = rec.coach ? Math.round((rec.coach.grandTotal / 50) * 46 * 10) / 10 : 0;
                const scaledParent = rec.parent ? Math.round((rec.parent.grandTotal / 50) * 46 * 10) / 10 : 0;
                const attPoints = rec.attendance ? Math.min(rec.attendance.present, 8) : 0;
                // Bar heights based on percentage of max contribution
                const coachPct = (scaledCoach / 46) * 100;
                const parentPct = (scaledParent / 46) * 100;
                const attPct = (attPoints / 8) * 100;
                return (
                  <div key={`${rec.year}-${rec.month}`} className="flex flex-1 flex-col items-center gap-1">
                    <div className="flex w-full items-end justify-center gap-0.5" style={{ height: 170 }}>
                      <div className="relative flex w-4 flex-col items-center justify-end">
                        <span className="mb-1 text-[9px] text-amber-600">{scaledCoach}</span>
                        <div
                          className="w-full rounded-t bg-amber-400"
                          style={{ height: `${Math.max(coachPct * 1.5, 4)}px` }}
                        />
                      </div>
                      <div className="relative flex w-4 flex-col items-center justify-end">
                        <span className="mb-1 text-[9px] text-pink-600">{scaledParent}</span>
                        <div
                          className="w-full rounded-t bg-pink-400"
                          style={{ height: `${Math.max(parentPct * 1.5, 4)}px` }}
                        />
                      </div>
                      <div className="relative flex w-4 flex-col items-center justify-end">
                        <span className="mb-1 text-[9px] text-emerald-600">{attPoints}</span>
                        <div
                          className="w-full rounded-t bg-emerald-400"
                          style={{ height: `${Math.max(attPct * 1.5, 4)}px` }}
                        />
                      </div>
                    </div>
                    <p className="text-[10px] text-zinc-500 leading-tight text-center">
                      {rec.label.split(" ")[0]}
                    </p>
                    <p className="text-[9px] text-zinc-400">
                      {rec.label.split(" ")[1]}
                    </p>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex items-center justify-center gap-4 text-xs text-zinc-500">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded bg-amber-400" /> المدرب /46
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded bg-pink-400" /> الوالدين /46
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded bg-emerald-400" /> الحضور /8
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Monthly Records */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">التفاصيل الشهرية</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {records.length === 0 ? (
            <p className="px-4 py-8 text-center text-zinc-400">لا توجد تقييمات بعد</p>
          ) : (
            <div className="divide-y">
              {records.map((rec) => {
                const key = `${rec.year}-${rec.month}`;
                const isExpanded = expandedMonth === key;
                return (
                  <div key={key}>
                    <button
                      className="flex w-full items-center gap-4 px-4 py-3 text-right transition-colors hover:bg-zinc-50 print:hover:bg-transparent"
                      onClick={() => setExpandedMonth(isExpanded ? null : key)}
                    >
                      <div className="flex-1">
                        <p className="font-medium text-zinc-900">{rec.label}</p>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="text-center">
                          <p className="text-[10px] text-zinc-400">الحضور</p>
                          {rec.attendance ? (
                            <p className={`font-semibold ${scoreColor(Math.min(rec.attendance.present, 8), 8)}`}>
                              {Math.min(rec.attendance.present, 8)}/8
                              <span className="text-[9px] text-zinc-400 mr-1">({rec.attendance.present}/{rec.attendance.total})</span>
                            </p>
                          ) : (
                            <p className="text-zinc-300">—</p>
                          )}
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] text-zinc-400">المدرب</p>
                          {rec.coach ? (
                            <p className={`font-semibold ${scoreColor(Math.round((rec.coach.grandTotal / 50) * 46 * 10) / 10, 46)}`}>
                              {Math.round((rec.coach.grandTotal / 50) * 46 * 10) / 10}/46
                            </p>
                          ) : (
                            <p className="text-zinc-300">—</p>
                          )}
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] text-zinc-400">الوالدين</p>
                          {rec.parent ? (
                            <p className={`font-semibold ${scoreColor(Math.round((rec.parent.grandTotal / 50) * 46 * 10) / 10, 46)}`}>
                              {Math.round((rec.parent.grandTotal / 50) * 46 * 10) / 10}/46
                            </p>
                          ) : (
                            <p className="text-zinc-300">—</p>
                          )}
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] text-zinc-400">الإجمالي</p>
                          <Badge className={scoreBadgeBg(rec.combined, 100)}>
                            {rec.combined}/100
                          </Badge>
                        </div>
                      </div>
                      <span className="print:hidden">
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-zinc-400" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-zinc-400" />
                        )}
                      </span>
                    </button>

                    {isExpanded && (
                      <div className="border-t bg-zinc-50/50 px-4 py-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          {/* Coach breakdown */}
                          <div className="space-y-3">
                            <h4 className="flex items-center gap-2 text-sm font-semibold text-amber-700">
                              <Star className="h-4 w-4" /> تقييم لاعب الشهر
                            </h4>
                            {rec.coach ? (
                              <div className="space-y-2 text-sm">
                                <CategoryRow label="التقنية" score={rec.coach.technicalTotal} max={15} items={[
                                  { label: "التحكم بالكرة", score: rec.coach.ballControl, max: 5 },
                                  { label: "التمرير", score: rec.coach.passing, max: 5 },
                                  { label: "التسديد", score: rec.coach.shooting, max: 5 },
                                ]} />
                                <CategoryRow label="البدنية" score={rec.coach.physicalTotal} max={10} items={[
                                  { label: "السرعة", score: rec.coach.speed, max: 5 },
                                  { label: "اللياقة", score: rec.coach.fitness, max: 5 },
                                ]} />
                                <CategoryRow label="التكتيكية" score={rec.coach.tacticalTotal} max={10} items={[
                                  { label: "التمركز", score: rec.coach.positioning, max: 5 },
                                  { label: "الوعي", score: rec.coach.gameAwareness, max: 5 },
                                ]} />
                                <CategoryRow label="السلوك" score={rec.coach.attitudeTotal} max={15} items={[
                                  { label: "الالتزام", score: rec.coach.commitment, max: 5 },
                                  { label: "العمل الجماعي", score: rec.coach.teamwork, max: 5 },
                                  { label: "الانضباط", score: rec.coach.discipline, max: 5 },
                                ]} />
                                {rec.coach.notes && (
                                  <p className="mt-2 rounded bg-amber-50 p-2 text-xs text-amber-800">
                                    ملاحظات: {rec.coach.notes}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <p className="text-xs text-zinc-400">لا يوجد تقييم من المدرب</p>
                            )}
                          </div>

                          {/* Parent breakdown */}
                          <div className="space-y-3">
                            <h4 className="flex items-center gap-2 text-sm font-semibold text-pink-700">
                              <Heart className="h-4 w-4" /> تقييم الوالدين
                            </h4>
                            {rec.parent ? (
                              <div className="space-y-2 text-sm">
                                <CategoryRow label="الانضباط" score={rec.parent.disciplineTotal} max={20} items={[
                                  { label: "الصلاة", score: rec.parent.prayer || 0, max: 10 },
                                  { label: "النوم", score: rec.parent.sleep || 0, max: 5 },
                                  { label: "الأكل الصحي", score: rec.parent.healthyEating || 0, max: 5 },
                                ]} />
                                <CategoryRow label="الأخلاق" score={rec.parent.moralsTotal} max={20} items={[
                                  { label: "الاحترام", score: rec.parent.respectOthers || 0, max: 10 },
                                  { label: "التحكم بالغضب", score: rec.parent.angerControl || 0, max: 10 },
                                ]} />
                                <CategoryRow label="المساهمة المنزلية" score={rec.parent.homeTotal} max={10} items={[
                                  { label: "تجهيز الشنطة", score: rec.parent.prepareBag || 0, max: 2 },
                                  { label: "ترتيب الأغراض", score: rec.parent.organizePersonal || 0, max: 3 },
                                  { label: "تلبية الطلبات", score: rec.parent.fulfillRequests || 0, max: 5 },
                                ]} />
                                {rec.parent.parentNotes && (
                                  <p className="mt-2 rounded bg-pink-50 p-2 text-xs text-pink-800">
                                    ملاحظات: {rec.parent.parentNotes}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <p className="text-xs text-zinc-400">لا يوجد تقييم من الوالدين</p>
                            )}
                          </div>
                        </div>

                        {/* Attendance for this month */}
                        {rec.attendance && (
                          <div className="mt-4 rounded-lg border bg-white p-3">
                            <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-emerald-700">
                              <CalendarCheck className="h-4 w-4" /> الحضور
                            </h4>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="text-green-600">حاضر: {rec.attendance.present}</span>
                              <span className="text-red-500">غائب: {rec.attendance.absent}</span>
                              <span className="text-amber-500">مستأذن: {rec.attendance.excused}</span>
                              <span className="mr-auto font-medium">
                                النسبة: <span className={scoreColor(rec.attendance.rate, 100)}>{rec.attendance.rate}%</span>
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ===== Category Row Component =====
function CategoryRow({
  label,
  score,
  max,
  items,
}: {
  label: string;
  score: number;
  max: number;
  items: { label: string; score: number; max: number }[];
}) {
  return (
    <div className="rounded-lg border bg-white p-2.5">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-700">{label}</span>
        <span className={`text-xs font-bold ${scoreColor(score, max)}`}>
          {score}/{max}
        </span>
      </div>
      <div className="mb-1.5 h-1.5 overflow-hidden rounded-full bg-zinc-100">
        <div
          className={`h-full rounded-full transition-all ${scoreBg(score, max)}`}
          style={{ width: `${(score / max) * 100}%` }}
        />
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5">
        {items.map((item) => (
          <span key={item.label} className="text-[10px] text-zinc-500">
            {item.label}: <span className={`font-medium ${scoreColor(item.score, item.max)}`}>{item.score}/{item.max}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ===== MAIN COMPONENT =====
export function StudentReportsContent() {
  const [view, setView] = useState<"overview" | "detail">("overview");
  const [loading, setLoading] = useState(true);

  const [students, setStudents] = useState<StudentReportSummary[]>([]);
  const [totals, setTotals] = useState({
    totalStudents: 0,
    evaluatedStudents: 0,
    globalAvgCoach: 0,
    globalAvgParent: 0,
    globalAvgCombined: 0,
    globalAttendanceRate: 0,
  });

  const [selectedStudent, setSelectedStudent] = useState<{
    id: string;
    name: string;
    ageGroup: string | null;
  } | null>(null);
  const [detailRecords, setDetailRecords] = useState<MonthlyRecord[]>([]);
  const [detailAverages, setDetailAverages] = useState({ coach: 0, parent: 0, combined: 0 });
  const [detailAttendance, setDetailAttendance] = useState({ present: 0, absent: 0, excused: 0, total: 0, rate: 0 });

  const loadOverview = useCallback(async () => {
    setLoading(true);
    const result = await getStudentsReportOverview();
    if (result.success && result.students) {
      setStudents(result.students);
      setTotals(result.totals!);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const handleSelectStudent = async (id: string) => {
    setLoading(true);
    const result = await getStudentDetailReport(id);
    if (result.success && result.student) {
      setSelectedStudent(result.student);
      setDetailRecords(result.records!);
      setDetailAverages(result.averages!);
      setDetailAttendance(result.attendanceSummary!);
      setView("detail");
    }
    setLoading(false);
  };

  const handleBack = () => {
    setView("overview");
    setSelectedStudent(null);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">📊 تقارير أداء اللاعبين</h1>
          <p className="text-sm text-zinc-500">
            تقييم لاعب الشهر + تقييم الوالدين + الحضور — عرض شامل لأداء كل لاعب على مدار الأشهر
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-800" />
        </div>
      ) : view === "overview" ? (
        <OverviewView
          students={students}
          totals={totals}
          onSelect={handleSelectStudent}
        />
      ) : selectedStudent ? (
        <DetailView
          student={selectedStudent}
          records={detailRecords}
          averages={detailAverages}
          attendanceSummary={detailAttendance}
          onBack={handleBack}
        />
      ) : null}
    </div>
  );
}
